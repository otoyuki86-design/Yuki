"""Run one groom through the three motion regimes for a set of solver configs."""

import argparse, json, sys

import numpy as np

sys.path.insert(0, __file__.rsplit("/", 1)[0])

from hcc import metrics, motion, neighbors
from hcc.groom import settled, synthetic_groom
from hcc.solver import Config, Solver


CONFIGS = {
    "baseline":   dict(iters=24),
    "attr_only":  dict(iters=24, use_attr=True),
    "align_only": dict(iters=24, use_align=True),
    "order_only": dict(iters=24, use_order=True),
    "order+sep":  dict(iters=24, use_order=True, use_sep=True),
    "+attr":      dict(iters=24, use_order=True, use_sep=True, use_attr=True),
    "+align":     dict(iters=24, use_order=True, use_sep=True, use_align=True),
    "all":        dict(iters=24, use_order=True, use_sep=True,
                       use_attr=True, use_align=True),
}


def run(g, P, cfg_kwargs, kind, frames, warmup=60):
    R, T = motion.sequence(kind, frames + warmup)
    s = Solver(g, P, Config(**cfg_kwargs))
    s.reset(R[0], T[0])
    acc = metrics.Accumulator(g, P)
    for i in range(frames + warmup):
        X = s.step(R[i], T[i])
        if i >= warmup:
            acc.add(X, R[i], T[i])
    return acc.summary()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--frames", type=int, default=240)
    ap.add_argument("--configs", default="baseline,attr_only,align_only,order_only,order+sep,+attr,+align,all")
    ap.add_argument("--motions", default="A,B,C")
    ap.add_argument("--out", default="")
    a = ap.parse_args()

    g = settled(synthetic_groom())
    P = neighbors.build(g)
    print(f"groom: {g.n_cards} cards x {g.n_joints} joints, "
          f"{len(P)} pairs ({int(P.has_order.sum())} ordered)\n")

    results = {}
    for kind in a.motions.split(","):
        print(f"=== motion {kind} ===")
        hdr = f"{'config':<12} {'inv_mean':>9} {'inv_peak':>9} {'flip':>8} {'cross':>8} {'ndev':>8}"
        print(hdr); print("-" * len(hdr))
        for name in a.configs.split(","):
            r = run(g, P, CONFIGS[name], kind, a.frames)
            results[f"{kind}/{name}"] = r
            print(f"{name:<12} {r['order_inversion_mean']:>9.4f} "
                  f"{r['order_inversion_peak']:>9.4f} {r['order_flip_rate']:>8.4f} "
                  f"{r['card_cross_mean']:>8.4f} {r['normal_dev_mean']:>8.4f}")
        print()

    if a.out:
        with open(a.out, "w") as f:
            json.dump(results, f, indent=2)


if __name__ == "__main__":
    main()
