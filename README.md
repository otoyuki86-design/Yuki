# Hair-card breakdown suppression via neighbouring bone-chain constraints

Research code for formulating constraints between the bone chains that drive
neighbouring hair cards, targeting the visual breakdown that hair cards show
**under large deformation only**.

Static breakdown (scalp visibility, density loss) is already solved
constructively by Hair Cap and crossed cards in *Auto Hair Card Extraction*
(TOG 2025); that same paper records large-deformation breakdown as an open
problem.  This work targets that gap from the simulation side.

## Layout

| path | contents |
|---|---|
| `track_b/hcc/` | Python reference solver, neighbour graph, metrics, motions |
| `track_b/run_experiment.py` | ablation driver over motion regimes A/B/C |
| `track_a/` | Unity runtime solver (not yet implemented) |
| `docs/groom_schema.md` | `groom.json`, the shared Track A / Track B input |
| `docs/formulation_notes.md` | **corrections to the formulation found by measurement** |

## Running

```bash
pip install numpy
python3 track_b/run_experiment.py --motions A,B,C --frames 240
```

## Status

Both research gates have been cleared on the Python track:

* **Gate 1** — breakdown reproduces only under large deformation.
  `order_flip_rate` separates quasi-static from large deformation by **23×**.
* **Gate 2** — the layer-order term works in isolation.
  `E_order` alone cuts order inversion by **96–99%** and flicker by **89–92%**.

`docs/formulation_notes.md` records six defects in the original formulation that
only measurement exposed, including two that changed the model rather than the
code: the order coordinate had to become the cylindrical radius, and `E_sep`
had to be merged into `E_order` because their independent sign conventions
agreed on only 45% of pairs and cancelled.
