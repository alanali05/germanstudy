---
name: dispatching-parallel-agents
description: Use when you have multiple independent problems across different domains — assigns one agent per domain for concurrent investigation instead of sequential. Do NOT use when failures are related or when agents would touch shared state.
---

# Dispatching Parallel Agents

## Core Principle

One agent per independent problem domain, working concurrently rather than sequentially.

## When It Works

- Multiple unrelated failures across different files or subsystems
- Each investigation can proceed without depending on the others
- Agents will not modify the same shared state

## When NOT to Use

- Failures are related (fixing one might solve others)
- You need full system understanding first
- During exploratory debugging
- Agents would interfere with shared state

## The Process

1. **Identify independent domains** — group failures by what's broken
2. **Create focused task briefs** — each agent gets:
   - Specific scope (one domain only)
   - Clear goal
   - All context needed to understand the problem
   - Exact expected output format
3. **Dispatch in parallel** — issue all agent calls in one response
4. **Review and integrate** — check for conflicts, run full test suite

## Effective Agent Prompts

Each prompt must be:
- **Focused** — one clear problem, not an open-ended investigation
- **Self-contained** — all context the agent needs, no assumed shared state
- **Specific output** — tell the agent exactly what to return

## After Results

Verify no conflicts between fixes before integrating. Run the full test suite on the merged result.
