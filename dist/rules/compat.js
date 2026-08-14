import { normalizeTools } from "./audit.js";
import { findLine } from "../parse.js";
export const AGENTS = ["claude", "cursor", "codex", "opencode", "gemini", "copilot"];
export const CORE_FIELDS = new Set([
    "name",
    "description",
    "license",
    "compatibility",
    "metadata",
    "allowed-tools",
]);
export const AGENT_FIELDS = {
    claude: new Set([
        ...CORE_FIELDS,
        "hooks",
        "context",
        "agent",
        "argument-hint",
        "user-invocable",
        "disallowed-tools",
        "disable-model-invocation",
        "model",
    ]),
    cursor: new Set([
        ...CORE_FIELDS,
        "disable-model-invocation",
        "user-invocable",
        "argument-hint",
    ]),
    codex: new Set([...CORE_FIELDS, "skill_url"]),
    opencode: new Set(CORE_FIELDS),
    gemini: new Set(CORE_FIELDS),
    copilot: new Set([...CORE_FIELDS, "disable-model-invocation", "user-invocable"]),
};
export const AGENT_LABEL = {
    claude: "Claude Code",
    cursor: "Cursor",
    codex: "Codex",
    opencode: "OpenCode",
    gemini: "Gemini CLI",
    copilot: "GitHub Copilot",
};
export function supportedAgents(frontmatter) {
    const keys = Object.keys(frontmatter);
    const result = {};
    for (const agent of AGENTS) {
        const unknown = keys.filter((key) => !AGENT_FIELDS[agent].has(key));
        const claudeOnly = keys.filter((key) => !CORE_FIELDS.has(key) && AGENT_FIELDS.claude.has(key));
        if (unknown.length > 0 && agent !== "claude") {
            result[agent] = claudeOnly.length > 0 && unknown.every((key) => AGENT_FIELDS.claude.has(key))
                ? "warn"
                : "warn";
        }
        else if (claudeOnly.length > 0 && agent !== "claude") {
            result[agent] = "warn";
        }
        else {
            result[agent] = "yes";
        }
    }
    return result;
}
export const compatRules = [
    {
        id: "compat/claude-only-field",
        check: ({ skill }) => {
            const findings = [];
            for (const key of Object.keys(skill.frontmatter)) {
                if (CORE_FIELDS.has(key))
                    continue;
                if (!AGENT_FIELDS.claude.has(key))
                    continue;
                const supported = AGENTS.filter((agent) => AGENT_FIELDS[agent].has(key));
                if (supported.length === AGENTS.length)
                    continue;
                findings.push({
                    rule: "compat/claude-only-field",
                    severity: "warning",
                    message: `frontmatter.${key} is not portable (supported: ${supported.join(", ")})`,
                    file: "SKILL.md",
                    line: findLine(skill.raw, new RegExp(`^${escapeRegExp(key)}\\s*:`, "m")),
                    hint: "Keep core behavior in the markdown body so Codex, Cursor, Gemini, Copilot, and OpenCode still work.",
                });
            }
            return findings;
        },
    },
    {
        id: "compat/unknown-field",
        check: ({ skill }) => {
            const findings = [];
            for (const key of Object.keys(skill.frontmatter)) {
                const known = AGENTS.some((agent) => AGENT_FIELDS[agent].has(key));
                if (known)
                    continue;
                findings.push({
                    rule: "compat/unknown-field",
                    severity: "info",
                    message: `frontmatter.${key} is not recognized by Claude, Cursor, Codex, OpenCode, Gemini, or Copilot`,
                    file: "SKILL.md",
                    line: findLine(skill.raw, new RegExp(`^${escapeRegExp(key)}\\s*:`, "m")),
                });
            }
            return findings;
        },
    },
    {
        id: "compat/context-fork",
        check: ({ skill }) => {
            if (skill.frontmatter.context !== "fork")
                return;
            return [
                {
                    rule: "compat/context-fork",
                    severity: "warning",
                    message: "context: fork is a Claude Code subagent feature and is ignored elsewhere",
                    file: "SKILL.md",
                    line: findLine(skill.raw, /^context\s*:/m),
                    hint: "Document a fallback workflow in the skill body for Codex and Cursor.",
                },
            ];
        },
    },
    {
        id: "compat/allowed-tools-support",
        check: ({ skill }) => {
            const tools = normalizeTools(skill.frontmatter["allowed-tools"]);
            if (tools.length === 0)
                return;
            return [
                {
                    rule: "compat/allowed-tools-support",
                    severity: "info",
                    message: "allowed-tools is experimental and not enforced the same way on every agent",
                    file: "SKILL.md",
                    line: findLine(skill.raw, /^allowed-tools\s*:/m),
                    hint: "Treat it as a Claude-oriented hint. Codex and OpenCode may ignore it.",
                },
            ];
        },
    },
];
function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
//# sourceMappingURL=compat.js.map