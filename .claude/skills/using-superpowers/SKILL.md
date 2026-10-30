---
name: using-superpowers
description: Use when starting ANY task — invoke relevant skills before responding or acting. If there is even a 1% chance a skill applies, invoke it. Process skills (brainstorming, systematic-debugging) take priority over implementation skills.
---

# Using Superpowers

## Core Directive

**Invoke relevant skills BEFORE any response or action**, including before asking clarifying questions or exploring code.

If you think there is even a **1% chance** a skill might apply, you ABSOLUTELY MUST invoke the skill.

## Skill Hierarchy

1. **User instructions** — override everything
2. **Skills** — override default behavior
3. **Default Claude behavior** — last resort only

## Process Skills Take Priority

When multiple skills fit, process skills take priority over implementation skills:
- `brainstorming` before designing
- `systematic-debugging` before fixing
- `writing-plans` before implementing
- `verification-before-completion` before claiming done

## Common Rationalizations to Refuse

- "This question is simple — no skill needed" → check anyway
- "I'll explore the code first, then check skills" → check skills first
- "The user just wants a quick answer" → check skills first
- "I already know what to do" → check skills first
- "This is just a clarifying question" → check skills first

## When to Ask vs. Act

Skills define when to ask. If no skill covers the decision, bias toward acting and let the user redirect.
