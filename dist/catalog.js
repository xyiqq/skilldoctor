export const RULE_CATALOG = [
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
export function formatRuleCatalog() {
    const width = Math.max(...RULE_CATALOG.map((rule) => rule.id.length));
    const lines = RULE_CATALOG.map((rule) => {
        const id = rule.id.padEnd(width);
        const severity = rule.severity.padEnd(7);
        return `${id}  ${severity}  ${rule.summary}`;
    });
    return `${lines.join("\n")}\n`;
}
//# sourceMappingURL=catalog.js.map