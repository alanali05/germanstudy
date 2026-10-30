---
name: writing-skills
description: Use when creating or updating a skill document — applies TDD principles to skill writing: write failing test scenarios first, then minimal skill content, then refactor to close loopholes.
---

# Writing Skills

## Core Philosophy

Writing skills IS Test-Driven Development applied to process documentation.

**NO SKILL WITHOUT A FAILING TEST FIRST.**

## The RED-GREEN-REFACTOR Cycle

### RED
1. Identify a repeated failure pattern (the "bug" in process)
2. Write concrete test scenarios that would fail without the skill
3. Establish baseline — confirm these scenarios fail with default behavior

### GREEN
4. Write minimal skill content that addresses the identified failures
5. Verify the skill would prevent the baseline failures

### REFACTOR
6. Test for loopholes — common rationalizations that bypass the skill
7. Add rationalization tables for the most tempting bypasses
8. Iterate until the skill is bulletproof

## Description Field (Critical)

The `description` frontmatter is how the skill gets discovered. It must:
- Start with "Use when..." (triggering conditions only)
- Never summarize the workflow
- Include specific symptoms, contexts, and searchable keywords
- Stay under 500 characters

## Token Efficiency Targets

- Getting-started skills: <150 words
- Frequently-loaded skills: <200 words
- Other skills: <500 words

## Key Principles

- One excellent example beats many mediocre ones
- Flowcharts only for non-obvious decisions
- Prohibition form for things that must never happen
- Recipe form for things that must always happen
- Build rationalization tables from actual observed rationalizations
