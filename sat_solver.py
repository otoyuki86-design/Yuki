"""
SAT Solver (Boolean Satisfiability Problem) using DPLL algorithm.

SAT is the first problem proven to be NP-complete (Cook's theorem, 1971).
Given a propositional formula in CNF, determine if there exists a truth
assignment that satisfies all clauses.

DPLL algorithm features:
  - Unit propagation: if a clause has only one unassigned literal, force it.
  - Pure literal elimination: if a variable appears with only one polarity,
    set it to satisfy all its clauses.
  - Backtracking search over variable assignments.
"""

from __future__ import annotations
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class Formula:
    """CNF formula: a list of clauses, each clause a frozenset of literals.
    Positive literal x  -> integer +x
    Negative literal ¬x -> integer -x
    """
    clauses: list[frozenset[int]]
    num_vars: int

    @classmethod
    def from_dimacs(cls, text: str) -> "Formula":
        clauses: list[frozenset[int]] = []
        num_vars = 0
        for line in text.splitlines():
            line = line.strip()
            if not line or line.startswith("c"):
                continue
            if line.startswith("p"):
                parts = line.split()
                num_vars = int(parts[2])
                continue
            lits = list(map(int, line.split()))
            if lits[-1] == 0:
                lits = lits[:-1]
            if lits:
                clauses.append(frozenset(lits))
        return cls(clauses, num_vars)

    def __repr__(self) -> str:
        clause_strs = []
        for c in self.clauses:
            lits = sorted(c, key=abs)
            clause_strs.append("(" + " ∨ ".join(
                f"¬x{abs(l)}" if l < 0 else f"x{abs(l)}" for l in lits
            ) + ")")
        return " ∧ ".join(clause_strs)


Assignment = dict[int, bool]  # variable -> True/False


def _propagate(clauses: list[frozenset[int]], assign: Assignment
               ) -> Optional[list[frozenset[int]]]:
    """Apply current assignment; return simplified clauses or None if conflict."""
    result = []
    for clause in clauses:
        remaining = []
        satisfied = False
        for lit in clause:
            var = abs(lit)
            if var in assign:
                if assign[var] == (lit > 0):
                    satisfied = True
                    break
            else:
                remaining.append(lit)
        if not satisfied:
            if not remaining:
                return None  # conflict: empty clause
            result.append(frozenset(remaining))
    return result


def _unit_propagate(clauses: list[frozenset[int]], assign: Assignment
                    ) -> Optional[list[frozenset[int]]]:
    """Repeatedly apply unit propagation until fixpoint or conflict."""
    changed = True
    while changed:
        changed = False
        for clause in clauses:
            if len(clause) == 1:
                (lit,) = clause
                var, val = abs(lit), lit > 0
                if var in assign:
                    if assign[var] != val:
                        return None  # conflict
                else:
                    assign[var] = val
                    changed = True
        clauses = _propagate(clauses, assign)
        if clauses is None:
            return None
    return clauses


def _pure_literal_assign(clauses: list[frozenset[int]], assign: Assignment
                          ) -> list[frozenset[int]]:
    """Assign pure literals (appear with only one polarity)."""
    all_lits: set[int] = set()
    for clause in clauses:
        all_lits |= clause
    for lit in all_lits:
        var = abs(lit)
        if var not in assign and -lit not in all_lits:
            assign[var] = lit > 0
    return _propagate(clauses, assign) or []


def _choose_var(clauses: list[frozenset[int]], assign: Assignment) -> int:
    """Pick the variable appearing in the most clauses (VSIDS-lite heuristic)."""
    freq: dict[int, int] = {}
    for clause in clauses:
        for lit in clause:
            var = abs(lit)
            if var not in assign:
                freq[var] = freq.get(var, 0) + 1
    return max(freq, key=lambda v: freq[v])


def dpll(clauses: list[frozenset[int]], assign: Assignment, num_vars: int
         ) -> Optional[Assignment]:
    """Recursive DPLL. Returns a satisfying assignment or None."""
    # Unit propagation
    assign_copy = dict(assign)
    clauses = _unit_propagate(clauses, assign_copy)
    if clauses is None:
        return None  # conflict
    if not clauses:
        # Fill unassigned variables arbitrarily
        for v in range(1, num_vars + 1):
            if v not in assign_copy:
                assign_copy[v] = True
        return assign_copy

    # Pure literal elimination
    clauses = _pure_literal_assign(clauses, assign_copy)
    if not clauses:
        for v in range(1, num_vars + 1):
            if v not in assign_copy:
                assign_copy[v] = True
        return assign_copy

    # Choose branching variable
    var = _choose_var(clauses, assign_copy)

    for val in (True, False):
        branch = dict(assign_copy)
        branch[var] = val
        branch_clauses = _propagate(clauses, branch)
        if branch_clauses is None:
            continue
        result = dpll(branch_clauses, branch, num_vars)
        if result is not None:
            return result

    return None  # UNSAT


def solve(formula: Formula) -> Optional[Assignment]:
    """Solve a CNF formula. Returns satisfying assignment or None if UNSAT."""
    return dpll(formula.clauses, {}, formula.num_vars)


# ---------------------------------------------------------------------------
# Demo
# ---------------------------------------------------------------------------

def _verify(formula: Formula, assign: Assignment) -> bool:
    for clause in formula.clauses:
        if not any(
            assign.get(abs(lit)) == (lit > 0)
            for lit in clause
        ):
            return False
    return True


EXAMPLES = [
    # (description, DIMACS string)
    (
        "Simple SAT: (x1 ∨ x2) ∧ (¬x1 ∨ x3) ∧ (¬x2 ∨ ¬x3)",
        """\
p cnf 3 3
1 2 0
-1 3 0
-2 -3 0
""",
    ),
    (
        "UNSAT: (x1) ∧ (¬x1)",
        """\
p cnf 1 2
1 0
-1 0
""",
    ),
    (
        "3-SAT instance (SAT)",
        """\
p cnf 4 5
1 -2 3 0
-1 2 -3 0
2 3 -4 0
-1 -3 4 0
1 2 4 0
""",
    ),
    (
        "Pigeonhole PHP(2,1): 2 pigeons, 1 hole (UNSAT)",
        # x_ij = pigeon i in hole j
        # Each pigeon in some hole: (x11 ∨ x12) for each pigeon — but 1 hole only
        # So: x11, x21 must both be true, but ¬x11 ∨ ¬x21 (at most 1 per hole)
        """\
p cnf 2 3
1 0
2 0
-1 -2 0
""",
    ),
]


def main() -> None:
    print("=" * 60)
    print("SAT Solver via DPLL  (NP-complete problem solver)")
    print("=" * 60)
    for desc, dimacs in EXAMPLES:
        formula = Formula.from_dimacs(dimacs)
        print(f"\n[Problem] {desc}")
        print(f"  Formula : {formula}")
        assign = solve(formula)
        if assign is None:
            print("  Result  : UNSATISFIABLE")
        else:
            assign_str = ", ".join(
                f"x{v}={'T' if b else 'F'}"
                for v, b in sorted(assign.items())
            )
            verified = _verify(formula, assign)
            print(f"  Result  : SATISFIABLE")
            print(f"  Assignment: {assign_str}")
            print(f"  Verified: {verified}")
    print("\n" + "=" * 60)


if __name__ == "__main__":
    main()
