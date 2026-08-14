import type { Severity } from "./types.js";

export interface RuleInfo {
  id: string;
  severity: Severity;
  summary: string;
}

export const RULE_CATALOG: RuleInfo[] = [
  { id: "lint/frontmatter-missing", severity: "error", summary: "SKILL.md has no YAML frontmatter" },
  { id: "lint/yaml-invalid", severity: "error", summary: "Frontmatter is not valid YAML" },
  { id: "lint/name-missing", severity: "error", summary: "name is required" },
  { id: "lint/name-invalid", severity: "error", summary: "name breaks Agent Skills charset or length rules" },
  { id: "lint/name-dir-mismatch", severity: "error", summary: "name does not match the parent directory" },
  { id: "lint/description-missing", severity: "error", summary: "description is required" },
  { id: "lint/description-invalid", severity: "error", summary: "description is the wrong type, empty, or too long" },
  { id: "lint/description-vague", severity: "warning", summary: "description is too short or missing a when-to-use clause" },
  { id: "lint/description-first-person", severity: "warning", summary: "description should be third person" },
  { id: "lint/compatibility-invalid", severity: "error", summary: "compatibility is not a 1-500 character string" },
  { id: "lint/metadata-invalid", severity: "error", summary: "metadata values must be strings" },
  { id: "lint/allowed-tools-invalid", severity: "error", summary: "allowed-tools must be a string or string list" },
  { id: "lint/body-too-long", severity: "warning", summary: "main SKILL.md exceeds 500 lines" },
  { id: "lint/broken-reference", severity: "error", summary: "relative scripts/references/assets link is missing" },
  { id: "lint/nested-reference", severity: "warning", summary: "reference is more than one level deep" },
  { id: "lint/windows-path", severity: "warning", summary: "backslashes in skill-relative paths" },
  { id: "lint/unknown-portable-field", severity: "info", summary: "field is outside the core spec" },
  { id: "lint/duplicate-name", severity: "warning", summary: "two skills in the same scan share a name" },
  { id: "audit/prompt-injection", severity: "error", summary: "jailbreak or hide-from-user instructions" },
  { id: "audit/hardcoded-secret", severity: "error", summary: "private key or well-known secret pattern" },
  { id: "audit/credential-path", severity: "error", summary: "reads SSH keys, cloud credentials, cookies, or .env" },
  { id: "audit/unconstrained-tools", severity: "error", summary: "Bash(*) or wildcard tool grant" },
  { id: "audit/pipe-to-shell", severity: "error", summary: "curl/wget piped into a shell" },
  { id: "audit/exfil-network", severity: "error", summary: "known dump or webhook hosts" },
  { id: "audit/path-escape", severity: "error", summary: "sensitive system paths" },
  { id: "audit/self-modify", severity: "warning", summary: "skill tells the agent to rewrite itself" },
  { id: "audit/obfuscated-code", severity: "warning", summary: "dynamic decode or eval in scripts/" },
  { id: "audit/dangerous-script", severity: "error", summary: "recursive delete or download-and-execute" },
  { id: "compat/claude-only-field", severity: "warning", summary: "frontmatter field is not portable" },
  { id: "compat/unknown-field", severity: "info", summary: "field is unrecognized by tracked agents" },
  { id: "compat/context-fork", severity: "warning", summary: "context: fork is Claude-only" },
  { id: "compat/allowed-tools-support", severity: "info", summary: "allowed-tools is experimental" },
  { id: "scan/duplicate-name", severity: "warning", summary: "same skill name installed in multiple agent directories" },
  { id: "scan/windows-symlink", severity: "warning", summary: "skill is installed as a symlink on Windows" },
];

export function formatRuleCatalog(): string {
  const width = Math.max(...RULE_CATALOG.map((rule) => rule.id.length));
  const lines = RULE_CATALOG.map((rule) => {
    const id = rule.id.padEnd(width);
    const severity = rule.severity.padEnd(7);
    return `${id}  ${severity}  ${rule.summary}`;
  });
  return `${lines.join("\n")}\n`;
}

const RULE_DETAILS: Record<string, string> = {
  "lint/frontmatter-missing": "Every skill folder needs SKILL.md starting with YAML between --- markers, then markdown instructions.",
  "lint/yaml-invalid": "The frontmatter block must parse as a YAML mapping. Quote values that contain colons or start with digits.",
  "lint/name-missing": "name is required. Agents use it as the skill id and slash-command.",
  "lint/name-invalid": "name must be 1-64 characters, lowercase a-z, 0-9, and single hyphens. No leading, trailing, or doubled hyphens.",
  "lint/name-dir-mismatch": "The Agent Skills spec requires frontmatter.name to match the parent directory name.",
  "lint/description-missing": "description is required. It is the only field most agents use to decide whether to load the skill.",
  "lint/description-invalid": "description must be a non-empty string of at most 1024 characters.",
  "lint/description-vague": "Say what the skill does and when to use it. Include trigger phrases such as \"Use when the user asks to...\".",
  "lint/description-first-person": "Write the description in third person. It is injected into the agent prompt.",
  "lint/compatibility-invalid": "compatibility is optional, but if present it must be a 1-500 character string.",
  "lint/metadata-invalid": "metadata must be a string-to-string map. Quote versions: version: \"1.0\".",
  "lint/allowed-tools-invalid": "allowed-tools must be a string or a list of strings, for example Bash(git:*) Read.",
  "lint/body-too-long": "Keep SKILL.md under 500 lines. Move long reference material into references/.",
  "lint/broken-reference": "Links to scripts/, references/, or assets/ must point to files that exist.",
  "lint/nested-reference": "Point SKILL.md at files one level deep. Avoid references/foo/bar.md chains.",
  "lint/windows-path": "Use POSIX slashes in skill-relative paths: scripts/hello.sh, not scripts\\hello.sh.",
  "lint/unknown-portable-field": "The field is outside the core spec. Run compat to see which agents honor it.",
  "lint/duplicate-name": "Two skills in the same scan share a name. Agents will only see one of them.",
  "audit/prompt-injection": "The text tries to override system policy or hide actions from the user. Remove it.",
  "audit/hardcoded-secret": "A private key or cloud token pattern is embedded in the skill. Revoke it if real.",
  "audit/credential-path": "The skill tells the agent to read SSH keys, cloud credentials, cookies, or .env files.",
  "audit/unconstrained-tools": "Bash(*) or a wildcard grant lets the skill run any shell command. Pin tools instead.",
  "audit/pipe-to-shell": "curl or wget piped into sh/bash downloads and runs unreviewed code.",
  "audit/exfil-network": "The skill mentions a dump host such as webhook.site or a Discord webhook.",
  "audit/path-escape": "The skill reaches sensitive system paths outside its directory.",
  "audit/self-modify": "A skill that rewrites its own SKILL.md can change after the user reviewed it.",
  "audit/obfuscated-code": "eval, base64 decode, or fromCharCode in scripts/ can hide a second payload.",
  "audit/dangerous-script": "The helper script deletes home/root trees or downloads and executes remote code.",
  "compat/claude-only-field": "This frontmatter field is not portable. Put the behavior in the markdown body for other agents.",
  "compat/unknown-field": "None of the tracked agents document this field. It will likely be ignored.",
  "compat/context-fork": "context: fork only runs a Claude Code subagent. Other agents ignore it.",
  "compat/allowed-tools-support": "allowed-tools is experimental. Claude may honor it; Codex and OpenCode may not.",
  "scan/duplicate-name": "The same skill name is installed for more than one local agent. Updates can drift.",
  "scan/windows-symlink": "Many Windows agents do not follow symlinked skill folders. Copy the directory instead.",
};

export function explainRule(id: string): string {
  const needle = id.trim();
  const exact = RULE_CATALOG.find((rule) => rule.id === needle);
  if (exact) {
    const detail = RULE_DETAILS[exact.id] ?? exact.summary;
    return `${exact.id}  (${exact.severity})\n${exact.summary}\n\n${detail}\n`;
  }
  const matches = RULE_CATALOG.filter((rule) => rule.id.includes(needle));
  if (matches.length === 1 && matches[0]) {
    return explainRule(matches[0].id);
  }
  if (matches.length > 1) {
    return `Ambiguous rule id "${needle}". Matches:\n${matches.map((rule) => `  ${rule.id}`).join("\n")}\n`;
  }
  return `Unknown rule id "${needle}". Run skilldoctor rules to list ids.\n`;
}
