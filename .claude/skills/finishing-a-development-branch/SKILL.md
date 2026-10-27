---
name: finishing-a-development-branch
description: Use after all implementation tasks pass verification — runs tests, detects environment, presents merge/PR/keep options, executes choice, and cleans up worktrees. Always confirm base branch before merging.
---

# Finishing a Development Branch

## Workflow: Verify → Detect → Present → Execute → Clean Up

## Step 1: Verify Tests

Run the full test suite. If tests fail, report failures and **stop** — the integration menu only appears after tests pass.

## Step 2: Detect Environment

```bash
GIT_DIR=$(cd "$(git rev-parse --git-dir)" && pwd -P)
GIT_COMMON=$(cd "$(git rev-parse --git-common-dir)" && pwd -P)
BRANCH=$(git branch --show-current)
```

Determines: normal repo vs. worktree, named branch vs. detached HEAD.

## Step 3: Confirm Base Branch

Identify the branch this work forked from. If uncertain: "This branch split from `<candidate>` — is that correct?" **Never merge without confirming the target.**

## Step 4: Present Menu

**Normal repo or named-branch worktree:**
1. Merge back to base branch locally
2. Push and create a Pull Request
3. Keep the branch as-is

**Detached HEAD:**
1. Push as new branch and create PR
2. Keep as-is

Present exactly as above — no modifications.

## Step 5: Execute

- **Option 1:** Merge locally → verify tests on merged result → clean up worktree
- **Option 2:** Push → create PR via `gh pr create` → preserve worktree for iteration
- **Option 3:** Leave everything unchanged

## Critical Rules

- Confirm base branch before merging
- Never force-push without explicit user request
- Run tests on merged result before cleanup
- Require explicit typed "discard" before deleting a worktree
