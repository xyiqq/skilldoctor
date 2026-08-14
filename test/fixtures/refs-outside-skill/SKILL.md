---
name: refs-outside-skill
description: Mentions paths that live outside the skill and glob-shaped references. Use when checking that lint does not resolve them against the skill directory.
---

# Refs Outside Skill

Machine-wide helpers are called by absolute path: `~/.claude/scripts/deploy.sh` and
`$HOME/.config/agent/scripts/rotate.sh`. Neither lives inside this skill.

A sibling checkout is referenced as ../../tooling/scripts/lint.sh, also outside the skill.

Load the matching `references/type-*.md` before drawing, and the theme file
`assets/${theme}.css` after it. Script templates are named `scripts/<verb>.py`.

Real reference: [notes](references/NOTES.md).
