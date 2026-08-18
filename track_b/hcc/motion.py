"""Head motion sequences for the three evaluation regimes (plan section 9)."""

import numpy as np


def _rot_y(a):
    c, s = np.cos(a), np.sin(a)
    return np.array([[c, 0, s], [0, 1, 0], [-s, 0, c]])


def _rot_x(a):
    c, s = np.cos(a), np.sin(a)
    return np.array([[1, 0, 0], [0, c, -s], [0, s, c]])


def _rot_z(a):
    c, s = np.cos(a), np.sin(a)
    return np.array([[c, -s, 0], [s, c, 0], [0, 0, 1]])


def sequence(kind, n_frames=240, fps=60.0):
    """Return (R, t) arrays of shape (F, 3, 3) and (F, 3)."""
    tt = np.arange(n_frames) / fps
    R = np.zeros((n_frames, 3, 3))
    T = np.zeros((n_frames, 3))

    for i, s in enumerate(tt):
        if kind == "A":            # quasi-static: slow yaw, small sway
            yaw = np.deg2rad(20.0) * np.sin(2 * np.pi * 0.25 * s)
            pitch = np.deg2rad(6.0) * np.sin(2 * np.pi * 0.18 * s)
            M = _rot_y(yaw) @ _rot_x(pitch)
            T[i] = [0.004 * np.sin(2 * np.pi * 0.25 * s), 0.0, 0.0]

        elif kind == "B":          # large deformation: fast yaw with hard stops
            f = 1.4
            yaw = np.deg2rad(85.0) * np.sin(2 * np.pi * f * s)
            # square-ish stop-and-go on top of the sine
            yaw += np.deg2rad(25.0) * np.sign(np.sin(2 * np.pi * f * s))
            pitch = np.deg2rad(28.0) * np.sin(2 * np.pi * (f * 0.7) * s)
            M = _rot_y(yaw) @ _rot_x(pitch)
            T[i] = [0.02 * np.sin(2 * np.pi * f * s), 0.05 * np.sin(2 * np.pi * 2.1 * s), 0.0]

        elif kind == "C":          # extreme: full tumble
            M = _rot_y(2 * np.pi * 0.9 * s) @ _rot_x(np.deg2rad(150.0) * np.sin(2 * np.pi * 0.6 * s)) @ _rot_z(np.deg2rad(60.0) * np.sin(2 * np.pi * 1.1 * s))
            T[i] = [0.03 * np.sin(2 * np.pi * 1.3 * s), 0.08 * np.sin(2 * np.pi * 1.7 * s), 0.03 * np.cos(2 * np.pi * 0.9 * s)]

        else:
            raise ValueError(kind)
        R[i] = M
    return R, T
