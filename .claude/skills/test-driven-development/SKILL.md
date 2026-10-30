---
name: test-driven-development
description: Use when implementing any feature or bug fix — enforces Red-Green-Refactor cycle. No production code without a failing test first. Code written before tests must be deleted and reimplemented.
---

# Test-Driven Development

## Iron Rule

**NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST.**

Code written before tests must be **deleted entirely** and reimplemented from scratch based on test requirements.

## The Red-Green-Refactor Cycle

### RED
1. Write a minimal failing test demonstrating the desired behavior
2. **Run the test — confirm it fails** (if it passes immediately, the test is wrong)
3. Confirm the failure message is meaningful

### GREEN
4. Implement the **simplest code** that makes the test pass
5. Run the test — confirm it passes
6. Run the full suite — confirm no regressions

### REFACTOR
7. Clean up code while keeping tests green
8. Run tests again to confirm

## Test Quality Standards

- **Minimal** — tests one behavior
- **Clear** — descriptive name explaining what it tests
- **Realistic** — uses real code paths, not mock-heavy setups
- Vague names like `test('retry works')` indicate the design needs simplification

## Mandatory Resets (Delete and Restart)

- Implementing before writing a test
- Test passes immediately without implementation
- Cannot explain why the test fails
- Deferring tests to "add later"

## Common Rationalizations (All Rejected)

"Too simple to test" / "Already manually tested" / "I'll add tests later" / "It's just a config change" — all require deletion and TDD restart.
