---
name: release-notes
description: Drafts concise release notes from merged pull requests and conventional commits. Use when the user asks for a changelog, release notes, or a GitHub release body.
license: MIT
metadata:
  author: skilldoctor
  version: "0.1.0"
---

# Release Notes

## Quick start

1. Read recent commits or merged pull requests.
2. Group changes into Added, Changed, Fixed, and Security.
3. Write short bullets that explain why the change matters.

## Output

```markdown
## Added
- ...

## Fixed
- ...
```

Keep the summary under 20 bullets. Do not invent changes that are not in the history.
