---
name: writing-plans
description: Use when transitioning from design to implementation — creates a detailed step-by-step plan before any code is written. Each task must be small, independently testable, and include actual code/commands (no placeholders).
---

# Writing Plans

## Purpose

Document a comprehensive implementation strategy so any developer (with minimal codebase context) can execute it correctly.

## Plan Structure

```
# Plan: <Goal>

## Header
- Goal: <one sentence>
- Architecture: <key decisions>
- Tech stack: <relevant>
- Global constraints: <must-nots, must-haves>

## File Structure
- Create: <file> — <purpose>
- Modify: <file> — <what changes>

## Tasks
### Task 1: <Name>
Files: <exact paths>
Interface: <what this task consumes / produces>
Steps:
- [ ] <actual code or exact command>
- [ ] Run: <verification command>
- [ ] Verify: <what passing looks like>
```

## Core Rules

- **No placeholders** — every step has actual code, exact file paths, concrete commands
- **Granular tasks** — each task is one small independently testable action (2–5 min)
- **TDD order** — write test → run → implement → verify → commit
- **No "add validation"** or "TBD" — those are not steps

## Self-Review Before Handoff

- [ ] Every requirement mapped to a task
- [ ] No placeholder patterns (`TODO`, `...`, `TBD`)
- [ ] Types consistent across task boundaries
