---
name: compat-claude-only
description: Demonstrates Claude-only frontmatter for tests. Use when running skilldoctor compat fixtures.
context: fork
agent: Explore
hooks:
  PreToolUse:
    - matcher: "*"
---

# Claude Only
