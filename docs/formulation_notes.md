# Formulation notes — corrections found by measurement

The plan (`§4`) was written before any groom existed.  Running it against a
real layered groom surfaced six defects.  Each is recorded here with the
measurement that exposed it, because they change the formulation, not just the
implementation.

---

## 1. The order coordinate cannot be the `û` projection

The plan wrote the layer-order term as `σ_cd (x_d − x_c) · û(s)`.

Measured, that is wrong in both directions:

| coordinate | failure |
|---|---|
| `(x_d − x_c) · û_c` | On a curved scalp, two cards **in the same layer** side by side give a large negative projection purely from curvature. Result: `has_order` fired on **99/99** same-layer pairs — every side-by-side pair was handed a spurious layer order. |
| spherical radius `‖x − m‖` | Below the head the depth term dominates. Layer separation collapsed from 4.5 mm to 1.0 mm by joint 6 and **inverted** at joint 7 (0.2098 / 0.2093 / 0.2091). |
| **cylindrical radius about the head axis** | Constant ~4.5 mm separation at every joint, correct order throughout, ≈0 for side-by-side pairs. **Adopted.** |

After the change, `has_order` became monotone in layer difference — 10/99 for
same-layer pairs, 73/86 for two-layers-apart — which is the geometrically
correct behaviour.

## 2. The order margin must be per-pair, not a global `δ_min`

Rest radial gaps are ~4.5 mm over most of the head but collapse to **1.0 mm at
the crown**, where the layer offset is nearly vertical.  Any global `δ_min`
either does nothing or leaves crown pairs permanently violated.

Replaced with `δ_min,cd = β · ρ̄_gap,cd`, clamped to never exceed the rest gap.
This adapts to local geometry and removes a hand-tuned constant.

## 3. Rest quantities must be baked on the settled shape

The authored rest pose is not a gravity equilibrium.  Released with a
**completely static head**, the groom sags ~2 cm and settles at a **0.1107
order-inversion floor** — 11% of ordered pairs permanently inverted before any
motion occurs.  Every breakdown metric was measuring sag plus motion.

Fix: bake all rest quantities on the settled configuration.  Settling is a
fixed point (the stiffness term pulls toward `X0`, so replacing `X0` moves the
equilibrium), so it is iterated:

```
pass 0: X0 shift 0.019800  residual inv 0.03243
pass 2: X0 shift 0.003147  residual inv 0.02431
pass 4: X0 shift 0.000417  residual inv 0.00000
pass 5: X0 shift 0.000138  residual inv 0.00000
```

Residual inversion reaches exactly zero. The production alternative is
sag-free initialisation (Sag-Free Init, TOG 2023).

## 4. M3's visible symptom is the temporal flip, not the static inversion

Separation between quasi-static (A) and large-deformation (B) motion, baseline:

| metric | A | B | ratio |
|---|---|---|---|
| `order_inversion_mean` | 0.187 | 0.237 | **1.3×** |
| `order_flip_rate` | 0.0038 | 0.0872 | **23×** |
| `card_cross_mean` | 0.031 | 0.188 | 6× |
| `normal_dev_mean` | 0.015 | 0.301 | 20× |

A *stably* inverted pair is invisible: the sort is consistent frame to frame,
so nothing flickers.  What the viewer sees is the frame-to-frame swap.
`order_flip_rate` is therefore the primary M3 metric and
`order_inversion_mean` is demoted to a diagnostic.

Inversion is also concentrated at the tips (0.00 at the root → 0.42 at joint 7)
and is nearly independent of the rest gap size, so it is a free-end phenomenon,
not a marginal-pair artefact.

## 5. `E_sep` and `E_order` cancelled — they needed one shared order coordinate

`E_sep` carried its own sign, `sign(δ̄_cd)`, taken along the card face normal.
Measured against `σ_cd`:

- **sign agreement: 0.447** — worse than chance
- **109 of 188** ordered pairs disagree on more than half their joints
- the two axes are nearly identical below the crown (0° from joint 3 on)

So the terms pushed along the same axis in opposite directions.  This was not
Jacobi dilution: `order+sep` failed to recover at 24 iterations (inv 0.1128)
or at `k_sep = 0.05` (inv 0.1052), while `order_only` reached 0.0084.

Fix: merge them.  Ordered pairs get one signed separation along the `ρ`
gradient with margin `max(β·gap, τ)`; unordered pairs get a plain unsigned
repulsion.  After merging, `order+sep` at 24 iterations reaches **inv 0.0170 /
flip 0.0169**, against 0.1128 / 0.0864 before.

## 6. `E_attr` is antagonistic; `E_twist` has no DOF to act on

**`E_attr`** degrades every target metric and *increases* interpenetration
(`cross` 0.1847 → 0.2223, and 0.2479 in the full config — the worst of any
setting).  Cohesion necessarily drags neighbours across layer boundaries and
through each other.  It buys only `normal_dev`.  Since M1 (scalp) and M5
(density) are already solved constructively by Hair Cap and crossed cards,
**cohesion may not belong in this formulation at all.**

**`E_twist`** is not implementable as specified.  With one bone chain per card
and no per-joint twist DOF, the card frame is fully determined by the chain
tangent plus the fixed root normal — there is no independent twist variable.
Adding one is a modelling change, not an implementation detail.

**`E_align`** was also rewritten relative to rest.  The plan's `1 − (n_c·n_d)²`
drives neighbours toward a common normal, but on a curved scalp neighbours
legitimately differ at rest, so the absolute form fights the hairstyle.

---

## Final ablation (motion B, large deformation, 24 solver iterations)

| config | inv | flip | cross | ndev |
|---|---|---|---|---|
| baseline | 0.2370 | 0.0872 | 0.1878 | 0.3013 |
| `attr_only` | 0.2291 | 0.0885 | **0.2794** | 0.1956 |
| `align_only` | **0.2513** | 0.0842 | 0.2142 | 0.2138 |
| **`order_only`** | **0.0084** | **0.0093** | 0.1839 | 0.3057 |
| `order+sep` | 0.0170 | 0.0169 | **0.1829** | 0.3064 |
| `+attr` | 0.0423 | 0.0326 | 0.2543 | 0.1978 |
| `+align` | 0.0471 | 0.0404 | 0.2002 | 0.2270 |
| `all` | 0.0588 | 0.0420 | 0.2479 | 0.1888 |

Across motions, `order_only` against baseline:

| motion | inv | flip |
|---|---|---|
| A quasi-static | 0.1870 → **0.0000** | 0.0038 → **0.0000** |
| B large deformation | 0.2370 → 0.0084 (−96%) | 0.0872 → 0.0093 (−89%) |
| C extreme | 0.2693 → 0.0041 (−98%) | 0.0588 → 0.0045 (−92%) |

### Reading

* **The layer-order term carries the whole result.**  Every other term degrades
  it monotonically: `order_only` 0.0084 → `order+sep` 0.0170 → `+align` 0.0471
  → `+attr`/`all` 0.0588.
* **`attr` and `align` each buy `ndev` and pay in `inv` and `cross`.**  Used
  alone, both are net negative on their own terms: `attr_only` leaves `inv`
  unchanged while making `cross` 49% worse; `align_only` makes `inv` *worse*
  than baseline.
* `order+sep` is the best configuration on `cross` and is within 2× of
  `order_only` on the order metrics, so the merged thickness floor is close to
  free.  It is the recommended default.
* **Caveat.**  `order_only` raises `cross` in the quasi-static regime
  (0.0310 → 0.0690): forcing radial order pushes cards through each other
  laterally when nothing else is driving them.  The merged form recovers most
  of this at large deformation but the quasi-static cost is real and unexplained.
* **Caveat.**  `ndev` (M4) is improved *only* by the terms that damage M3 and
  M2.  With no twist DOF, M4 may not be reachable from this constraint family
  at all — see §6.
