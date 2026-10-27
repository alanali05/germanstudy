---
name: requesting-code-review
description: Use after completing major features, before merging to main, or when a fresh perspective is needed — dispatches a subagent reviewer with base+head commits to protect the main context window.
---

# Requesting Code Review

## When to Request

**Mandatory:**
- After completing tasks in subagent-driven workflows
- After finishing a major feature
- Before merging to main

**Recommended:**
- Stuck on a problem and need a fresh perspective
- Establishing a baseline before a refactor

## The Process

1. Get two git commit hashes:
   ```bash
   BASE=$(git merge-base HEAD main)  # or your base branch
   HEAD=$(git rev-parse HEAD)
   ```

2. Dispatch a general-purpose subagent with:
   - The base and head commits
   - What was changed and why
   - Any specific concerns to focus on
   - Expected output format

3. Review findings:
   - **Critical** — fix immediately
   - **Important** — fix before proceeding
   - **Minor** — address later

## Why a Subagent

You are the coordinator. Reviewing the diff inline burns the context window you need to keep driving the work. Delegating review preserves your coordination context.

## Response to Findings

Fix critical and important issues before proceeding. Push back on findings with supporting technical reasoning when appropriate. Do not skip reviews for "simple" changes.
