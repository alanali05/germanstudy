---
name: verification-before-completion
description: Use when about to claim work is complete, fixed, or passing — before committing, creating PRs, or moving to next task. Run the verification command fresh; evidence before assertions always.
---

# Verification Before Completion

## Iron Law

```
NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE
```

If you haven't run the verification command **in this message**, you cannot claim it passes.

## The Gate Function

Before claiming any status:

1. **IDENTIFY** — What command proves this claim?
2. **RUN** — Execute the full command (fresh, complete)
3. **READ** — Full output, check exit code, count failures
4. **VERIFY** — Does output confirm the claim?
   - If NO: State actual status with evidence
   - If YES: State claim WITH evidence
5. **ONLY THEN** — Make the claim

## What Each Claim Requires

| Claim | Requires |
|-------|----------|
| Tests pass | Test command output: 0 failures |
| Build succeeds | Build command: exit 0 |
| Bug fixed | Test original symptom: passes |
| Requirements met | Line-by-line checklist verified |
| Agent completed | VCS diff shows actual changes |

## Red Flags — STOP

- Using "should", "probably", "seems to"
- About to commit/push without running verification
- Trusting an agent's success report without checking the diff
- "Partial check is enough"
- Any wording implying success without having run verification

## Applies To

- ANY completion or success claim
- ANY expression of satisfaction ("Done!", "Fixed!", "Working!")
- Before committing, creating PRs, or moving to the next task
