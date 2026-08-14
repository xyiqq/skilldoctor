# Rule catalog

Stable identifiers. Command flags and file paths stay in English.

## lint

| ID | Severity | Meaning |
|---|---|---|
| `lint/frontmatter-missing` | error | `SKILL.md` has no YAML frontmatter |
| `lint/yaml-invalid` | error | Frontmatter is not valid YAML |
| `lint/name-missing` | error | `name` is required |
| `lint/name-invalid` | error | `name` breaks the Agent Skills charset or length rules |
| `lint/name-dir-mismatch` | error | `name` does not match the parent directory |
| `lint/description-missing` | error | `description` is required |
| `lint/description-invalid` | error | `description` is the wrong type, empty, or too long |
| `lint/description-vague` | warning | Description is too short or missing a "when to use" clause |
| `lint/description-first-person` | warning | Description should be third person |
| `lint/compatibility-invalid` | error | `compatibility` is not a 1-500 character string |
| `lint/metadata-invalid` | error | `metadata` values must be strings |
| `lint/allowed-tools-invalid` | error | `allowed-tools` must be a string or string list |
| `lint/body-too-long` | warning | Main `SKILL.md` exceeds 500 lines |
| `lint/broken-reference` | error | Relative `scripts/`, `references/`, or `assets/` link is missing |
| `lint/nested-reference` | warning | Reference is more than one level deep |
| `lint/windows-path` | warning | Backslashes in skill-relative paths |
| `lint/unknown-portable-field` | info | Field is outside the core spec |

## audit

| ID | Severity | Meaning |
|---|---|---|
| `audit/prompt-injection` | error | Jailbreak or hide-from-user instructions |
| `audit/hardcoded-secret` | error | Private key or well-known secret pattern |
| `audit/credential-path` | error | Reads SSH keys, cloud credentials, cookies, or `.env` |
| `audit/unconstrained-tools` | error | `Bash(*)` or wildcard tool grant |
| `audit/pipe-to-shell` | error | `curl` / `wget` piped into a shell |
| `audit/exfil-network` | error | Known dump or webhook hosts |
| `audit/path-escape` | error | Sensitive system paths |
| `audit/self-modify` | warning | Skill tells the agent to rewrite itself |
| `audit/obfuscated-code` | warning | Dynamic decode or `eval` in `scripts/` |
| `audit/dangerous-script` | error | Recursive delete or download-and-execute |

## compat

| ID | Severity | Meaning |
|---|---|---|
| `compat/claude-only-field` | warning | Frontmatter field is not portable |
| `compat/unknown-field` | info | Field is unrecognized by the four tracked agents |
| `compat/context-fork` | warning | `context: fork` is Claude-only |
| `compat/allowed-tools-support` | info | `allowed-tools` is experimental |

## scan

| ID | Severity | Meaning |
|---|---|---|
| `scan/duplicate-name` | warning | Same skill name is installed in more than one agent directory |
| `scan/windows-symlink` | warning | Skill is installed as a symlink on Windows |
