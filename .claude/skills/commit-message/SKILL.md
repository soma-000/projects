---
name: commit-message
description: Generates a git commit message. Use when committing changes or summarizing what was modified.
---

When generating a commit message, follow this format:

## Format
```
<type>: <short summary>

<optional body>
```

## Types
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code restructuring without behavior change
- `docs`: Documentation changes
- `chore`: Maintenance tasks (dependencies, config, etc.)

## Rules
- Summary line is under 72 characters
- Use imperative mood ("add", "fix", "update" — not "added", "fixed")
- Body explains *why*, not *what*