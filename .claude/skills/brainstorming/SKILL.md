---
name: brainstorming
description: Use when designing a new feature, system, or approach BEFORE writing any code. Enforces a hard gate: no implementation until the user approves a written design. Invoke before writing-plans.
---

# Brainstorming

## Hard Gate

**DO NOT write any code, scaffold any project, or take any implementation action until you have presented a design and the user has approved it.**

This applies even to projects that seem simple.

## Nine-Step Workflow

1. Explore project context (read files, docs, existing patterns)
2. Offer a visual companion (mockup/diagram) only when it genuinely helps — as a separate message
3. Ask clarifying questions **one at a time** — never a list
4. Propose **2–3 approaches** with trade-offs clearly stated
5. Present design in sections appropriate to the complexity
6. Write design doc to `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`
7. Self-review the spec: look for placeholders, contradictions, ambiguity
8. Ask the user to review the written spec
9. Invoke `writing-plans` to transition to implementation

## Design Principles

- **Design for isolation and clarity** — single-purpose units, well-defined interfaces
- Each unit independently understandable and testable
- No implementation details until design is approved

## Transition

The only skill invoked after brainstorming is `writing-plans`. Never jump directly to code.
