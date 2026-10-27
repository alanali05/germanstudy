---
name: systematic-debugging
description: Use when diagnosing a bug or unexpected behavior. Enforces root cause investigation BEFORE any fix attempt. If ≥3 fix attempts fail, stop and question the architecture.
---

# Systematic Debugging

## Iron Rule

**NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST.**

## Phase 1: Root Cause Investigation

- Read error messages carefully — extract exact failure point
- Reproduce the issue consistently
- Check recent changes (git log/diff)
- Add diagnostic instrumentation at component boundaries
- Gather evidence at each layer to reveal *where* the failure originates

## Phase 2: Pattern Analysis

- Find working examples in the codebase
- Compare working vs. broken implementations line by line
- Identify the exact difference

## Phase 3: Hypothesis and Testing

- Form a **specific, falsifiable** hypothesis
- Test with minimal changes only
- Verify the hypothesis is confirmed before proceeding to fix

## Phase 4: Implementation

1. Write a failing test that captures the bug
2. Implement a single fix targeting the root cause
3. Verify the test passes
4. Verify no regressions

## Escalation Rule

**If ≥ 3 fix attempts fail: STOP.** This signals an architectural problem, not a simple bug. Discuss with the user before proceeding further.

## Red Flags (You've Left the Process)

- "Quick fix for now" thinking
- Assuming without verifying
- Attempting successive fixes without understanding why the previous one failed
- Fixing symptoms instead of causes
