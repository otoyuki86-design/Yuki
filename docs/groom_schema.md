# `groom.json` schema

Shared input for Track A (Unity) and Track B (Python). Baked once from the rest pose.

```jsonc
{
  "meta": {
    "name": "synthetic_bob",
    "n_cards": 96,
    "n_joints": 8,          // joints per chain (uniform)
    "head_center": [0,0,0],
    "head_radius": 0.09
  },

  // One bone chain per card. joints[0] is the root (on the scalp).
  "cards": [
    {
      "id": 0,
      "root": [x,y,z],           // scalp position
      "scalp_normal": [x,y,z],   // u_hat at the root
      "layer": 0,                 // rest layer index (0 = innermost)
      "width": 0.012,             // card half-width
      "joints": [[x,y,z], ...],   // rest positions, length n_joints
      "seg_len": [l0, l1, ...],   // rest segment lengths, length n_joints-1
      "normals": [[x,y,z], ...],  // rest card face normals per joint
      "widths":  [[x,y,z], ...]   // rest card width direction per joint
    }
  ],

  // Neighbor graph N, built once in the rest pose (plan section 3).
  "pairs": [
    {
      "c": 0, "d": 5,
      "sigma": 1,                 // order sign: +1 if d is outside c along u_hat
      "d_bar": [.., ..],          // target distance per joint index
      "delta_bar": [.., ..],      // rest signed distance along c's face normal
      "feat": {                   // features for the identification regression (plan section 6)
        "rest_dist": 0.021,
        "root_geo": 0.018,
        "normal_angle": 0.12,
        "layer_diff": 1
      }
    }
  ]
}
```

## Conventions

- Arrays of vectors are flat `[x,y,z]` triples, world space, Y-up, metres.
- `pairs` is deduplicated: each unordered pair appears once, with `c < d`.
- `sigma` and `delta_bar` are computed in the rest pose and never recomputed at runtime.
- Per-joint arrays are indexed by joint, not by arc length `s`; arc length is
  `s = j / (n_joints - 1)`.
