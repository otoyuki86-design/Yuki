"""Vector helpers and card-frame construction.

All arrays are float64 and carry an explicit trailing axis of size 3.
"""

import numpy as np

EPS = 1e-12


def normalize(v, axis=-1):
    n = np.linalg.norm(v, axis=axis, keepdims=True)
    return v / np.maximum(n, EPS)


def tangents(X):
    """Per-joint tangents of chains.

    X : (C, J, 3) joint positions.
    Returns (C, J, 3); the last joint reuses the previous segment direction.
    """
    d = np.diff(X, axis=1)
    d = np.concatenate([d, d[:, -1:, :]], axis=1)
    return normalize(d)


def radial(u_root, T):
    """View-independent radial direction u_hat, transported along the chain.

    The plan defines u_hat(s) as the scalp normal carried along the strand.  We
    transport it by removing the tangential component at every joint, which is
    stable and needs no parallel-transport bookkeeping.

    u_root : (C, 3) scalp normal at the root.
    T      : (C, J, 3) tangents.
    """
    u = u_root[:, None, :]
    u_perp = u - np.sum(u * T, axis=-1, keepdims=True) * T
    n = np.linalg.norm(u_perp, axis=-1, keepdims=True)
    # Where the tangent is parallel to the scalp normal the projection vanishes;
    # fall back to any vector orthogonal to the tangent.
    fallback = np.cross(T, np.array([0.0, 0.0, 1.0]))
    fb_n = np.linalg.norm(fallback, axis=-1, keepdims=True)
    fallback = np.where(fb_n < 1e-6, np.cross(T, np.array([0.0, 1.0, 0.0])), fallback)
    u_perp = np.where(n < 1e-6, fallback, u_perp)
    return normalize(u_perp)


def card_frames(X, u_root):
    """Return (T, N, W): tangent, face normal, width direction per joint.

    The card faces outward, so its normal is the transported radial direction.
    With one bone chain per card and no per-joint twist DOF, the frame is fully
    determined by the chain geometry plus the fixed root normal.
    """
    T = tangents(X)
    N = radial(u_root, T)
    W = normalize(np.cross(T, N))
    return T, N, W
