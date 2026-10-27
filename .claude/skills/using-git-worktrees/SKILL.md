---
name: using-git-worktrees
description: Use when starting feature work that needs isolation, or before executing implementation plans — detects existing isolation first, uses native worktree tools (EnterWorktree) if available, falls back to git worktree add.
---

# Using Git Worktrees

## Core Principle

Detect existing isolation first. Use native tools. Fall back to git. Never fight the harness.

## Step 0: Detect Existing Isolation

```bash
GIT_DIR=$(cd "$(git rev-parse --git-dir)" 2>/dev/null && pwd -P)
GIT_COMMON=$(cd "$(git rev-parse --git-common-dir)" 2>/dev/null && pwd -P)
```

**Submodule guard:**
```bash
git rev-parse --show-superproject-working-tree 2>/dev/null
```

- `GIT_DIR != GIT_COMMON` (and not a submodule) → already in a worktree → skip to Step 2
- `GIT_DIR == GIT_COMMON` → normal repo → proceed to Step 1

## Step 1: Create Isolated Workspace

### 1a. Native Tools (preferred)
Use `EnterWorktree` tool if available. Native tools handle placement, branching, and cleanup automatically.

### 1b. Git Fallback (only if no native tool)

Directory priority:
1. Explicit user preference
2. Existing `.worktrees/` or `worktrees/` at project root
3. Default to `.worktrees/`

**Safety check (must run before creating):**
```bash
git check-ignore -q .worktrees 2>/dev/null
```
If NOT ignored: add to `.gitignore` and commit first.

```bash
git worktree add ".worktrees/$BRANCH_NAME" -b "$BRANCH_NAME"
```

## Step 2: Project Setup

```bash
if [ -f package.json ]; then npm install; fi
```

## Step 3: Verify Clean Baseline

Run the test suite. Report failures and ask whether to proceed. Only continue with a clean baseline confirmed by the user.

## Quick Reference

| Situation | Action |
|-----------|--------|
| Already in linked worktree | Skip creation |
| Native tool available | Use it |
| `.worktrees/` not ignored | Add to .gitignore + commit first |
| Permission error on create | Work in place |
