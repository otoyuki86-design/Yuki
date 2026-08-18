"""Breakdown metrics (plan section 9).

Alpha-sort flicker is measured directly as the rate at which ordered pairs swap
their radial order between consecutive frames.  That is the actual cause of the
flicker, so it isolates M3 more cleanly than an image-space PSNR proxy would.
"""

import numpy as np

from . import geom, neighbors


class Accumulator:
    def __init__(self, g, P):
        self.g, self.P = g, P
        self.prev_sign = None
        self.inv = []        # order inversion rate per frame
        self.flip = []       # order flip rate between consecutive frames
        self.cross = []      # card interpenetration rate
        self.ndev = []       # mean normal-angle deviation from rest (radians)

    def add(self, X, R, t):
        g, P = self.g, self.P
        ci, di = P.c, P.d

        # --- M3: radial order ------------------------------------------
        Xl = (X - t) @ R
        rho = neighbors.rho(Xl, g.head_center)
        m = P.has_order
        if m.any():
            s = np.sign(rho[di[m]] - rho[ci[m]])          # (Pm, J)
            good = P.sigma[m][:, None]
            self.inv.append(float((s != good).mean()))
            if self.prev_sign is not None:
                self.flip.append(float((s != self.prev_sign).mean()))
            self.prev_sign = s
        else:
            self.inv.append(0.0)

        # --- M2: card interpenetration ---------------------------------
        T, N, W = geom.card_frames(X, g.u_root @ R.T)
        delta = X[di] - X[ci]
        sd = np.sum(delta * N[ci], axis=-1)
        flipped = np.sign(sd) != np.sign(P.delta_bar)
        # Only counts as interpenetration if the cards also overlap laterally.
        lat = np.abs(np.sum(delta * W[ci], axis=-1))
        overlap = lat < (g.half_width[ci] + g.half_width[di])[:, None]
        self.cross.append(float((flipped & overlap).mean()))

        # --- M4: normal deviation from rest -----------------------------
        dot = np.clip(np.sum(N[ci] * N[di], axis=-1), -1, 1)
        rest = np.clip(
            np.sum(
                geom.card_frames(g.X0, g.u_root)[1][ci]
                * geom.card_frames(g.X0, g.u_root)[1][di],
                axis=-1,
            ),
            -1, 1,
        )
        self.ndev.append(float(np.abs(np.arccos(dot) - np.arccos(rest)).mean()))

    def summary(self):
        f = lambda a: float(np.mean(a)) if len(a) else 0.0
        pk = lambda a: float(np.max(a)) if len(a) else 0.0
        return {
            "order_inversion_mean": f(self.inv),
            "order_inversion_peak": pk(self.inv),
            "order_flip_rate": f(self.flip),
            "card_cross_mean": f(self.cross),
            "card_cross_peak": pk(self.cross),
            "normal_dev_mean": f(self.ndev),
        }
