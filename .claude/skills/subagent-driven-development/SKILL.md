---
name: subagent-driven-development
description: Use when you have a written implementation plan with mostly independent tasks — dispatches fresh implementer subagents per task with isolated context, fix loops, and ledger tracking that survives context compaction.
---

# Subagent-Driven Development

## When to Apply

- A detailed implementation plan already exists
- Tasks are mostly independent
- Work stays within the current session

## Core Methodology

**Fresh implementer subagent per task + task review + broad final review.**

Each task gets its own agent with precisely crafted instructions. The controller coordinates — it does not implement.

## Per-Task Loop

1. **Dispatch implementer** with task brief and report-file path
2. **Handle report**: DONE / DONE_WITH_CONCERNS / NEEDS_CONTEXT / BLOCKED
3. **Review task** with a dedicated task reviewer (spec compliance + code quality)
4. **Fix loop** (max 5 rounds):
   - Rounds 1–3: resume original implementer
   - Rounds 4–5: fresh implementer on a more capable model
5. **Complete task** with ledger entry

## Ledger Tracking (Critical)

Conversation memory does not survive compaction. Track progress in a ledger file:

```
.superpowers/sdd/<plan-basename>/progress.md
```

Every task completion, finding, and decision is a ledger entry. No silent discards.

## Fix Loop Rules

- Minor findings → defer to final review
- Critical/Important findings → fix loop
- At round 5 cap: adjudicate as parked (with ruling) or BLOCKED
- Every scoped fix requires a scoped re-review

## Final Review

After all tasks: dispatch final reviewer on most capable model with the merged diff. One fix dispatch for all final findings. One scoped re-review. Adjudicate residuals. Hand off to `finishing-a-development-branch`.

## Common Mistakes

| Rationalization | Reality |
|----------------|---------|
| "I'll fix it myself" | Controller fixes skip review |
| "Close enough" | Gaps require fixing or adjudicating |
| "Skip the re-review" | Unreviewed fixes introduce regressions |
