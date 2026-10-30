# Code review

1. Pin the scope: requested files, PR, commit range, or working-tree changes. Record the exact base/head when applicable. For a working tree, include staged, unstaged, and relevant untracked files. Ask for a base if a branch comparison is ambiguous.
2. Read repository instructions and the requested behavior/spec. Read changed code and its connected callers, tests, fixtures, config, and exports. Trace changed behavior beyond the diff before calling it a bug.
3. Check correctness and edge cases, security and data loss, compatibility, error handling, and whether tests exercise the risky paths. Prefer a reproducible failure or a concrete input/output trace over a speculative smell.
4. Run relevant existing checks when safe. Record what ran and what passed/failed; distinguish pre-existing failures. Ask before executing untrusted code or tests that require credentials, destructive operations, or external services.
5. Return the report in [review.md](review.md) with file:line evidence and a verification step for each finding. Label taste and maintainability suggestions as optional unless their impact is demonstrated.

For an explicitly requested **Standards vs Spec** review, read [../../code-review/SKILL.md](../../code-review/SKILL.md) and follow its two-axis process and output instead. If that sibling skill is unavailable, report that limitation and perform the direct review above without claiming the two-axis workflow ran.

Read-only means no source edits, commits, formatting writes, or automatic fixes. Review commands may create disposable test/build outputs; keep them outside the subject where practical.
