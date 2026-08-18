"""Groom container and a synthetic layered hair-card generator.

A groom is C cards, each driven by one bone chain of J joints.  Cards are
arranged in explicit radial layers so that the layer-order breakdown (M3) is
well posed: layer 0 sits against the scalp, higher layers sit outside it.
"""

import json
from dataclasses import dataclass, field

import numpy as np

from . import geom


@dataclass
class Groom:
    X0: np.ndarray              # (C, J, 3) rest joint positions
    u_root: np.ndarray          # (C, 3) scalp normal at each root
    layer: np.ndarray           # (C,) rest layer index
    seg_len: np.ndarray         # (C, J-1) rest segment lengths
    half_width: np.ndarray      # (C,) card half-width
    head_center: np.ndarray     # (3,)
    head_radius: float
    name: str = "groom"
    pairs: dict = field(default_factory=dict)

    @property
    def n_cards(self):
        return self.X0.shape[0]

    @property
    def n_joints(self):
        return self.X0.shape[1]


def _scalp_directions(n, rng, polar_max_deg=100.0, face_gap_deg=70.0):
    """Sample outward scalp normals over the hair-bearing region of a head.

    Uses a golden-angle spiral in cos(polar) so samples stay well spread, then
    drops a frontal wedge where a face would be.
    """
    out = []
    golden = np.pi * (3.0 - np.sqrt(5.0))
    cos_min = np.cos(np.deg2rad(polar_max_deg))
    i = 0
    # Oversample, then reject the face wedge, until n directions survive.
    while len(out) < n:
        k = i + 0.5
        cz = 1.0 - k / (n * 2.2) * (1.0 - cos_min)
        cz = max(cz, cos_min)
        polar = np.arccos(cz)
        azim = golden * i
        # +Z is the facing direction; drop a wedge around it below the crown.
        facing = np.rad2deg(np.abs(np.arctan2(np.sin(azim), np.cos(azim))))
        in_face_wedge = (np.rad2deg(polar) > 45.0) and (
            min(abs(azim % (2 * np.pi)), 2 * np.pi - (azim % (2 * np.pi)))
            < np.deg2rad(face_gap_deg)
        )
        i += 1
        if in_face_wedge:
            continue
        out.append(
            [np.sin(polar) * np.cos(azim), np.cos(polar), np.sin(polar) * np.sin(azim)]
        )
        if i > 40 * n:
            break
    d = np.array(out[:n], dtype=float)
    # Small jitter so cards are not perfectly regular.
    d += rng.normal(scale=0.01, size=d.shape)
    return geom.normalize(d)


def synthetic_groom(
    n_per_layer=32,
    n_layers=3,
    n_joints=8,
    head_radius=0.09,
    layer_gap=0.007,
    seg_len=0.035,
    half_width=0.011,
    seed=0,
    name="synthetic_bob",
):
    """Build a shoulder-length layered groom hanging around a spherical head."""
    rng = np.random.RandomState(seed)
    head_center = np.zeros(3)
    down = np.array([0.0, -1.0, 0.0])

    dirs = _scalp_directions(n_per_layer, rng)

    X, U, L, HW = [], [], [], []
    for layer in range(n_layers):
        offset = layer * layer_gap
        for d in dirs:
            root = head_center + (head_radius + offset) * d
            # Start tangent to the scalp, heading down.
            t = down - np.dot(down, d) * d
            if np.linalg.norm(t) < 1e-6:
                t = np.array([1.0, 0.0, 0.0])
            t = t / np.linalg.norm(t)

            pts = [root]
            p = root.copy()
            for j in range(n_joints - 1):
                # Gravity progressively takes over from the surface tangent.
                w = min(1.0, (j / max(1, n_joints - 2)) ** 0.7)
                dir_j = (1.0 - w) * t + w * down
                dir_j = dir_j / max(np.linalg.norm(dir_j), 1e-12)
                p = p + seg_len * dir_j
                # Keep the card outside the head shell for this layer.
                r = p - head_center
                rn = np.linalg.norm(r)
                shell = head_radius + offset
                if rn < shell:
                    p = head_center + r / max(rn, 1e-12) * shell
                pts.append(p.copy())
            X.append(np.array(pts))
            U.append(d)
            L.append(layer)
            HW.append(half_width)

    X0 = np.array(X)
    u_root = np.array(U)
    lengths = np.linalg.norm(np.diff(X0, axis=1), axis=-1)
    return Groom(
        X0=X0,
        u_root=u_root,
        layer=np.array(L),
        seg_len=lengths,
        half_width=np.array(HW),
        head_center=head_center,
        head_radius=head_radius,
        name=name,
    )


def save_json(g: Groom, path):
    cards = []
    T, N, W = geom.card_frames(g.X0, g.u_root)
    for c in range(g.n_cards):
        cards.append(
            {
                "id": int(c),
                "root": g.X0[c, 0].tolist(),
                "scalp_normal": g.u_root[c].tolist(),
                "layer": int(g.layer[c]),
                "width": float(g.half_width[c]),
                "joints": g.X0[c].tolist(),
                "seg_len": g.seg_len[c].tolist(),
                "normals": N[c].tolist(),
                "widths": W[c].tolist(),
            }
        )
    doc = {
        "meta": {
            "name": g.name,
            "n_cards": g.n_cards,
            "n_joints": g.n_joints,
            "head_center": g.head_center.tolist(),
            "head_radius": g.head_radius,
        },
        "cards": cards,
        "pairs": g.pairs.get("json", []),
    }
    with open(path, "w") as f:
        json.dump(doc, f)
    return path


def settled(g, cfg=None, max_frames=1500, tol=1e-7, passes=6):
    """Return a copy of the groom whose rest shape is the gravity equilibrium.

    The authored rest pose is not an equilibrium: released under gravity the
    groom sags by ~2 cm and a tenth of the ordered pairs end up permanently
    inverted, which would contaminate every breakdown metric with a static
    offset that has nothing to do with motion.  Baking the rest quantities on
    the settled shape isolates motion-induced breakdown.  (The production
    alternative is sag-free initialisation, Sag-Free Init, TOG 2023.)

    Settling is a fixed point: the solver's stiffness term pulls toward X0, so
    replacing X0 with the settled shape moves the equilibrium again.  Iterating
    a few passes drives the residual inversion to exactly zero.
    """
    from .neighbors import build
    from .solver import Config, Solver

    for _ in range(passes):
        g = _settle_once(g, cfg, max_frames, tol)
    return g


def _settle_once(g, cfg, max_frames, tol):
    from .neighbors import build
    from .solver import Config, Solver

    R, t = np.eye(3), np.zeros(3)
    s = Solver(g, build(g), cfg or Config())
    s.reset(R, t)
    prev = s.X.copy()
    for i in range(max_frames):
        X = s.step(R, t)
        if i > 20 and np.abs(X - prev).max() < tol:
            break
        prev = X.copy()

    out = Groom(
        X0=X.copy(),
        u_root=g.u_root.copy(),
        layer=g.layer.copy(),
        seg_len=np.linalg.norm(np.diff(X, axis=1), axis=-1),
        half_width=g.half_width.copy(),
        head_center=g.head_center.copy(),
        head_radius=g.head_radius,
        name=g.name + "_settled",
    )
    return out
