"""Position-based reference solver.

Mirrors what the Unity track will do: Verlet integrate, enforce chain lengths
root-to-tip, push out of the head collider, then apply the neighbour-pair
constraints of plan section 4.  Every pair term is individually toggleable so
each one can be ablated on its own.

Deviation from the plan, recorded deliberately
----------------------------------------------
* E_order uses the cylindrical order coordinate, not the u_hat projection --
  see the module docstring of neighbors.py.
* E_align is written RELATIVE TO REST.  The plan's 1 - (n_c.n_d)^2 drives every
  neighbouring card toward a common normal, but on a curved scalp neighbours
  legitimately differ at rest, so the absolute form fights the hairstyle.
* E_twist is NOT implemented.  With one bone chain per card and no per-joint
  twist DOF the card frame is fully determined by the chain tangent plus the
  fixed root normal, so there is no independent twist variable to constrain.
  Adding one is a modelling change, not an implementation detail.
"""

from dataclasses import dataclass

import numpy as np

from . import geom, neighbors


@dataclass
class Config:
    dt: float = 1.0 / 60.0
    iters: int = 6
    gravity: tuple = (0.0, -9.81, 0.0)
    damping: float = 0.06          # velocity damping per step
    stiffness: float = 0.02        # pull back toward the head-local rest shape

    use_order: bool = False
    use_sep: bool = False
    use_attr: bool = False
    use_align: bool = False

    k_order: float = 1.0           # projection relaxation, 0..1
    k_sep: float = 0.6
    k_attr: float = 0.4
    k_align: float = 0.25

    beta_order: float = 0.5        # margin as a fraction of the rest radial gap
    tau_sep: float = 0.004         # minimum card separation along the face normal
    e_brk: float = 0.02            # attraction saturation scale (metres)
    collider_margin: float = 0.004


class Solver:
    def __init__(self, g, pairs, cfg=None):
        self.g = g
        self.P = pairs
        self.cfg = cfg or Config()
        C, J = g.n_cards, g.n_joints
        self.C, self.J = C, J
        # Free joints are everything but the kinematic root.
        self.w = np.ones((C, J, 1))
        self.w[:, 0, :] = 0.0
        self.reset(np.eye(3), np.zeros(3))

    # ---- frame helpers -------------------------------------------------
    def _to_world(self, Xl, R, t):
        return Xl @ R.T + t

    def _to_local(self, Xw, R, t):
        return (Xw - t) @ R

    def reset(self, R, t):
        self.X = self._to_world(self.g.X0, R, t)
        self.Xprev = self.X.copy()

    # ---- constraint stages ---------------------------------------------
    def _lengths(self):
        """Root-to-tip distance projection; the parent is already settled."""
        X, L = self.X, self.g.seg_len
        for j in range(1, self.J):
            d = X[:, j] - X[:, j - 1]
            n = np.linalg.norm(d, axis=-1, keepdims=True)
            X[:, j] = X[:, j - 1] + d / np.maximum(n, 1e-12) * L[:, j - 1][:, None]

    def _collider(self, R, t):
        """Push joints out of the head sphere."""
        c = t + R @ self.g.head_center
        rad = self.g.head_radius + self.cfg.collider_margin
        d = self.X - c
        n = np.linalg.norm(d, axis=-1, keepdims=True)
        hit = n < rad
        if hit.any():
            push = c + d / np.maximum(n, 1e-12) * rad
            self.X = np.where(hit & (self.w > 0), push, self.X)

    def _pairs(self, R, t):
        cfg, P, X = self.cfg, self.P, self.X
        if len(P) == 0:
            return
        dX = np.zeros_like(X)
        cnt = np.zeros((self.C, self.J, 1))

        ci, di = P.c, P.d
        wc, wd = self.w[ci], self.w[di]          # (P, J, 1)
        wsum = np.maximum(wc + wd, 1e-12)

        def scatter(dc, dd):
            np.add.at(dX, ci, dc)
            np.add.at(dX, di, dd)
            np.add.at(cnt, ci, 1.0)
            np.add.at(cnt, di, 1.0)

        # --- E_order + thickness: ONE constraint on ONE order coordinate ---
        # E_sep originally carried its own sign, sign(delta_bar), taken along the
        # card face normal.  Measured on a real groom that ordering agrees with
        # the radial ordering sigma on only 45% of pairs, so the two terms pull
        # opposite ways on more than half the neighbourhood and cancel.  They are
        # therefore merged: ordered pairs get a signed separation along the rho
        # gradient whose margin is the larger of the order margin and the
        # thickness floor; unordered pairs (side by side, no meaningful layer
        # order) get a plain unsigned repulsion instead.
        if cfg.use_order or cfg.use_sep:
            Xl = self._to_local(X, R, t)
            r = Xl.copy()
            r[..., 1] = 0.0
            rho = np.linalg.norm(r, axis=-1, keepdims=True)
            h = (r / np.maximum(rho, 1e-12)) @ R.T     # world-space grad of rho

            m = P.has_order
            if cfg.use_order and m.any():
                margin = cfg.beta_order * P.gap_bar[m]
                if cfg.use_sep:
                    margin = np.maximum(margin, cfg.tau_sep)
                # never demand more separation than the pair had at rest
                margin = np.minimum(margin, P.gap_bar[m])[:, None, None]
                sig = P.sigma[m][:, None, None]
                Cv = sig * (rho[di[m]] - rho[ci[m]]) - margin
                lam = np.where(Cv < 0, Cv, 0.0) * cfg.k_order / wsum[m]
                np.add.at(dX, ci[m], lam * wc[m] * sig * h[ci[m]])
                np.add.at(dX, di[m], -lam * wd[m] * sig * h[di[m]])
                np.add.at(cnt, ci[m], 1.0)
                np.add.at(cnt, di[m], 1.0)

            mm = ~P.has_order
            if cfg.use_sep and mm.any():
                dvec = X[di[mm]] - X[ci[mm]]
                n = np.linalg.norm(dvec, axis=-1, keepdims=True)
                u = dvec / np.maximum(n, 1e-12)
                target = np.minimum(cfg.tau_sep, P.d_bar[mm][..., None])
                Cv = n - target
                lam = np.where(Cv < 0, Cv, 0.0) * cfg.k_sep / wsum[mm]
                np.add.at(dX, ci[mm], lam * wc[mm] * u)
                np.add.at(dX, di[mm], -lam * wd[mm] * u)
                np.add.at(cnt, ci[mm], 1.0)
                np.add.at(cnt, di[mm], 1.0)

        # --- E_attr: one-sided saturating cohesion -------------------------
        if cfg.use_attr:
            d = X[di] - X[ci]
            n = np.linalg.norm(d, axis=-1, keepdims=True)
            u = d / np.maximum(n, 1e-12)
            e = n - P.d_bar[..., None]
            act = e > 0
            sat = 1.0 / (1.0 + (e / cfg.e_brk) ** 2)
            lam = np.where(act, e, 0.0) * sat * cfg.k_attr / wsum
            scatter(lam * wc * u, -lam * wd * u)

        # --- E_align: preserve the rest relative tangent orientation -------
        if cfg.use_align:
            ec = X[ci, 1:] - X[ci, :-1]
            ed = X[di, 1:] - X[di, :-1]
            Lc = np.linalg.norm(ec, axis=-1, keepdims=True)
            Ld = np.linalg.norm(ed, axis=-1, keepdims=True)
            tc, td = ec / np.maximum(Lc, 1e-12), ed / np.maximum(Ld, 1e-12)
            dot = np.sum(tc * td, axis=-1, keepdims=True)
            Cv = dot - P.dot_bar[:, :-1, None]
            gc = (td - dot * tc) / np.maximum(Lc, 1e-12)
            gd = (tc - dot * td) / np.maximum(Ld, 1e-12)
            denom = np.maximum(2.0 * (np.sum(gc * gc, -1, keepdims=True)
                                      + np.sum(gd * gd, -1, keepdims=True)), 1e-9)
            lam = -Cv * cfg.k_align / denom
            wc1, wd1 = wc[:, 1:], wd[:, 1:]
            np.add.at(dX, (ci, slice(1, None)), lam * gc * wc1)
            np.add.at(dX, (ci, slice(0, -1)), -lam * gc * wc1)
            np.add.at(dX, (di, slice(1, None)), lam * gd * wd1)
            np.add.at(dX, (di, slice(0, -1)), -lam * gd * wd1)
            np.add.at(cnt, (ci, slice(1, None)), 1.0)
            np.add.at(cnt, (di, slice(1, None)), 1.0)

        self.X = X + dX / np.maximum(cnt, 1.0) * self.w

    # ---- step ------------------------------------------------------------
    def step(self, R, t):
        cfg = self.cfg
        g = np.array(cfg.gravity)
        vel = (self.X - self.Xprev) * (1.0 - cfg.damping)
        self.Xprev = self.X.copy()
        Xn = self.X + vel + g * cfg.dt ** 2
        # Weak pull toward the head-local rest shape (VRM 'stiffness').
        if cfg.stiffness > 0:
            Xn = Xn + cfg.stiffness * (self._to_world(self.g.X0, R, t) - Xn)
        self.X = np.where(self.w > 0, Xn, self._to_world(self.g.X0, R, t))

        for _ in range(cfg.iters):
            self._lengths()
            self._collider(R, t)
            self._pairs(R, t)
        self._lengths()
        return self.X
