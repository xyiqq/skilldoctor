import { asString, findLine } from "../parse.js";
const PATTERNS = [
    {
        id: "audit/prompt-injection",
        severity: "error",
        message: "instructions try to override system or hidden-user policy",
        hint: "Remove jailbreak, ignore-previous, or hide-from-user language.",
        pattern: /\b(ignore|disregard|forget)\b.{0,40}\b(previous|prior|above|system)\b.{0,20}\b(instructions?|prompts?|rules?)\b/i,
    },
    {
        id: "audit/prompt-injection",
        severity: "error",
        message: "instructions tell the agent to hide actions from the user",
        pattern: /\b(do not|don't|never)\b.{0,24}\b(tell|inform|mention|reveal|notify)\b.{0,16}\buser\b/i,
    },
    {
        id: "audit/prompt-injection",
        severity: "error",
        message: "instructions contain jailbreak or unrestricted-persona language",
        pattern: /\b(jailbreak|dan mode|no restrictions|without (any )?restrictions|you are now unrestricted)\b/i,
    },
    {
        id: "audit/hardcoded-secret",
        severity: "error",
        message: "possible hardcoded secret or private key",
        hint: "Revoke the credential if it is real. Skills must not ship secrets.",
        pattern: /(-----BEGIN (?:RSA |OPENSSH |EC |DSA )?PRIVATE KEY-----)|(AKIA[0-9A-Z]{16})|(sk-[A-Za-z0-9]{20,})|(gh[pousr]_[A-Za-z0-9_]{20,})|(xox[baprs]-[A-Za-z0-9-]{10,})|(api[_-]?key\s*[:=]\s*['\"][A-Za-z0-9_\-]{16,})/i,
    },
    {
        id: "audit/credential-path",
        severity: "error",
        message: "skill reads credential or secret files on the host",
        hint: "Do not instruct agents to read SSH keys, cloud credentials, cookies, or .env files.",
        pattern: /\b(read|cat|type|open|load|source|print|dump|copy|scp|upload|exfiltrat\w*)\b[\s\S]{0,120}(~\/\.ssh\/|~\/\.aws\/credentials|~\/\.gnupg\/|\bid_rsa\b|\bid_ed25519\b|\.env(?:\.[A-Za-z0-9]+)?\b|cookies?\.sqlite|%APPDATA%)/i,
    },
    {
        id: "audit/pipe-to-shell",
        severity: "error",
        message: "remote content is piped directly into a shell",
        hint: "Download, review, then run. Never curl | sh from a skill.",
        pattern: /\b(curl|wget)\b[^\n]{0,160}\|\s*(sh|bash|zsh|pwsh|powershell)\b/i,
    },
    {
        id: "audit/exfil-network",
        severity: "error",
        message: "possible data exfiltration endpoint",
        pattern: /\b(discord(?:app)?\.com\/api\/webhooks|webhook\.site|ngrok\.(io|app)|requestbin|pipedream\.net|hooks\.slack\.com)\b/i,
    },
    {
        id: "audit/path-escape",
        severity: "error",
        message: "skill reaches outside its directory into sensitive system paths",
        pattern: /(\/etc\/(?:passwd|shadow|sudoers)|C:\\\\Windows\\\\System32|\/proc\/self|\\\\Windows\\\\System32)/i,
    },
    {
        id: "audit/self-modify",
        severity: "warning",
        message: "skill instructs the agent to rewrite its own SKILL.md after install",
        hint: "Self-modifying skills can change behavior after the user reviewed them.",
        pattern: /\b(overwrite|rewrite|replace|edit|modify|update)\b.{0,40}\b(this )?(skill\.md|your own skill|the installed skill)\b/i,
    },
    {
        id: "audit/obfuscated-code",
        severity: "warning",
        message: "obfuscated or dynamically decoded code can hide malicious behavior",
        scriptsOnly: true,
        pattern: /\b(eval\s*\(|Function\s*\(|atob\s*\(|Buffer\.from\(\s*[^,]+,\s*['\"]base64['\"]|String\.fromCharCode\()/i,
    },
];
const UNCONSTRAINED_TOOLS = /(^|[\s,])(\*|Bash|Bash\(\*\)|Bash\(\.\*\)|Shell)([\s,]|$)/;
export const auditRules = [
    {
        id: "audit/unconstrained-tools",
        check: ({ skill }) => {
            const raw = skill.frontmatter["allowed-tools"];
            const tokens = normalizeTools(raw);
            if (tokens.length === 0)
                return;
            const joined = tokens.join(" ");
            if (!UNCONSTRAINED_TOOLS.test(joined) && !tokens.includes("*"))
                return;
            return [
                {
                    rule: "audit/unconstrained-tools",
                    severity: "error",
                    message: "allowed-tools grants unconstrained shell or wildcard access",
                    file: "SKILL.md",
                    line: findLine(skill.raw, /allowed-tools\s*:/),
                    hint: "Pin tools, for example: Bash(git:*) Read Grep",
                },
            ];
        },
    },
    {
        id: "audit/pattern-scan",
        check: ({ skill, files }) => {
            const findings = [];
            for (const file of files) {
                for (const item of PATTERNS) {
                    if (item.scriptsOnly && !file.relativePath.startsWith("scripts/"))
                        continue;
                    const match = item.pattern.exec(file.content);
                    if (!match)
                        continue;
                    findings.push({
                        rule: item.id,
                        severity: item.severity,
                        message: item.message,
                        file: file.relativePath,
                        line: findLine(file.content, item.pattern),
                        hint: item.hint,
                    });
                }
            }
            const description = asString(skill.frontmatter.description) ?? "";
            for (const item of PATTERNS.filter((rule) => rule.inFrontmatter)) {
                if (item.pattern.test(description)) {
                    findings.push({
                        rule: item.id,
                        severity: item.severity,
                        message: item.message,
                        file: "SKILL.md",
                        line: findLine(skill.raw, item.pattern),
                        hint: item.hint,
                    });
                }
            }
            return dedupe(findings);
        },
    },
    {
        id: "audit/dangerous-script",
        check: ({ files }) => {
            const findings = [];
            for (const file of files.filter((item) => item.relativePath.startsWith("scripts/"))) {
                if (/\brm\s+(-rf|--recursive)\s+[~/]/.test(file.content)) {
                    findings.push({
                        rule: "audit/dangerous-script",
                        severity: "error",
                        message: "script contains a recursive delete aimed at a home or root path",
                        file: file.relativePath,
                        line: findLine(file.content, /rm\s+(-rf|--recursive)/),
                    });
                }
                if (/\binvoke-webrequest\b/i.test(file.content) && /\biex\b|invoke-expression/i.test(file.content)) {
                    findings.push({
                        rule: "audit/dangerous-script",
                        severity: "error",
                        message: "PowerShell script downloads remote content and executes it",
                        file: file.relativePath,
                        line: findLine(file.content, /invoke-webrequest/i),
                    });
                }
            }
            return findings;
        },
    },
];
export function normalizeTools(value) {
    if (typeof value === "string") {
        return value
            .split(/[,\s]+/)
            .map((item) => item.trim())
            .filter(Boolean);
    }
    if (Array.isArray(value)) {
        return value.filter((item) => typeof item === "string").map((item) => item.trim());
    }
    return [];
}
function dedupe(findings) {
    const seen = new Set();
    return findings.filter((item) => {
        const key = `${item.rule}:${item.file}:${item.line}:${item.message}`;
        if (seen.has(key))
            return false;
        seen.add(key);
        return true;
    });
}
//# sourceMappingURL=audit.js.map