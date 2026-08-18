"""Rest-pose neighbor graph and the per-pair quantities the solver consumes.

Built once, never recomputed at runtime (plan section 3), so Unity can bake the
same table into a ScriptableObject.

Order coordinate
----------------
The plan wrote the layer-order term against the transported scalp normal,
sigma * (x_d - x_c) . u_hat.  Measured on a real head that is wrong: on a curved
scalp two cards sitting side by side in the SAME layer produce a large negative
projection purely from curvature, so every side-by-side pair is handed a
spurious layer order.  A spherical radius fails the other way -- below the head
the depth term dominates and the layers collapse and then invert.

The coordinate that behaves is the cylindrical radius about the head's vertical
axis: it is view independent, it separates the layers by a constant margin at
every joint, and it is ~0 for side-by-side pairs.  See docs/formulation_notes.md.
"""

from dataclasses import dataclass

import numpy as np

from . import geom


@dataclass
class Pairs:
    c: np.ndarray           # (P,) first card index
    d: np.ndarray           # (P,) second card index
    sigma: np.ndarray       # (P,) order sign, +1 if d sits radially outside c
    has_order: np.ndarray   # (P,) bool: rest radial order is unambiguous
    gap_bar: np.ndarray     # (P,) mean rest radial gap, sets the per-pair margin
    d_bar: np.ndarray       # (P, J) rest distance
    delta_bar: np.ndarray   # (P, J) rest signed distance along c's face normal
    dot_bar: np.ndarray     # (P, J) rest tangent-tangent dot (for E_align)
    feat: np.ndarray        # (P, 4) [rest_dist, root_geo, normal_angle, layer_diff]

    def __len__(self):
        return self.c.shape[0]


def rho(X, head_center):
    """Order coordinate: cylindrical radius about the head's vertical axis."""
    r = X - head_center
    return np.sqrt(r[..., 0] ** 2 + r[..., 2] ** 2)


def build(g, max_root_geo=0.045, max_rest_dist=0.05, order_eps=0.0008):
    """Build the neighbor graph N.

    max_root_geo  : geodesic root distance cut-off on the scalp (metres)
    max_rest_dist : mean rest card distance cut-off (metres)
    order_eps     : minimum unambiguous rest radial gap.  Pairs below this sit
                    side by side rather than stacked, so their layer order is
                    not meaningful and E_order must not act on them.
    """
    C = g.n_cards
    T, N, W = geom.card_frames(g.X0, g.u_root)

    cosang = np.clip(g.u_root @ g.u_root.T, -1.0, 1.0)
    root_geo = np.arccos(cosang) * g.head_radius

    ci, di = np.triu_indices(C, k=1)
    delta = g.X0[di] - g.X0[ci]                     # (P, J, 3)
    dist = np.linalg.norm(delta, axis=-1)           # (P, J)
    mean_dist = dist.mean(axis=1)

    keep = (root_geo[ci, di] < max_root_geo) & (mean_dist < max_rest_dist)
    ci, di = ci[keep], di[keep]
    delta, dist, mean_dist = delta[keep], dist[keep], mean_dist[keep]

    R = rho(g.X0, g.head_center)                    # (C, J)
    drho = R[di] - R[ci]                            # (P, J)
    mean_drho = drho.mean(axis=1)
    sigma = np.where(mean_drho >= 0, 1.0, -1.0)
    consistent = np.all(np.sign(drho) == sigma[:, None], axis=1)
    has_order = (np.abs(mean_drho) > order_eps) & consistent
    gap_bar = np.abs(mean_drho)

    delta_bar = np.sum(delta * N[ci], axis=-1)
    dot_bar = np.sum(T[ci] * T[di], axis=-1)
    normal_angle = np.arccos(
        np.clip(np.sum(N[ci] * N[di], axis=-1), -1, 1)
    ).mean(axis=1)

    feat = np.stack(
        [mean_dist, root_geo[ci, di], normal_angle,
         np.abs(g.layer[di] - g.layer[ci]).astype(float)],
        axis=1,
    )

    return Pairs(
        c=ci, d=di, sigma=sigma, has_order=has_order, gap_bar=gap_bar,
        d_bar=dist, delta_bar=delta_bar, dot_bar=dot_bar, feat=feat,
    )
