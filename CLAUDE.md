# Project Rules

## Change Tracking

All changes made during a session must be logged in `context.md` at the project root. Each entry should include:
- What was changed
- Why it was changed
- Files affected

## Agent Workflow

- **Planning & task decomposition**: Use Claude Opus 4.6 agent to think through problems, design solutions, and create detailed task breakdowns.
- **Code execution**: Use Claude Sonnet 4.6 agent to implement the planned instructions and write code.

This separation ensures high-quality reasoning for architecture decisions while keeping execution fast and cost-efficient.
