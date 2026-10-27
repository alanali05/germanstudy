---
name: executing-plans
description: Use when implementing a written plan — loads the plan, executes tasks one at a time with verification, and stops immediately on blockers. Never start on main/master without explicit consent.
---

# Executing Plans

## Step 1: Load and Review

- Read the plan file completely
- Ensure an isolated workspace exists (invoke `using-git-worktrees` if needed)
- Review critically — identify questions or concerns before starting
- Resolve any ambiguities with the user before proceeding

## Step 2: Execute Tasks

For each task:
1. Mark task as in-progress
2. Follow steps **exactly as written**
3. Run the specified verification command
4. Confirm output matches expected result
5. Mark task complete

## Critical Stopping Points

**STOP immediately when:**
- A blocker is hit (missing dependency, test fails, instruction unclear)
- Verification fails and you cannot determine why
- A step contradicts another step
- You are unsure whether to proceed

Report the blocker with full context. Do not improvise around it.

## Constraints

- **Never implement on main/master** without explicit user consent
- Verification over speed — follow steps exactly, do not skip
- If a task's output doesn't match expectations, stop and report before continuing

## Completion

After all tasks verify: invoke `finishing-a-development-branch`.
