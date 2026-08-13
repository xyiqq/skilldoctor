import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { basename, join, relative, resolve, sep } from "node:path";
import { loadSkill } from "./parse.js";
import { IGNORE_DIR_NAMES } from "./types.js";
const TEXT_EXTENSIONS = new Set([
    ".md",
    ".txt",
    ".py",
    ".js",
    ".mjs",
    ".cjs",
    ".ts",
    ".tsx",
    ".sh",
    ".bash",
    ".zsh",
    ".ps1",
    ".json",
    ".yml",
    ".yaml",
    ".toml",
    ".rb",
    ".go",
    ".rs",
]);
export const PROJECT_SKILL_ROOTS = [
    ".agents/skills",
    ".cursor/skills",
    ".codex/skills",
    ".claude/skills",
    ".opencode/skills",
    ".gemini/skills",
    "skills",
];
export const HOME_SKILL_ROOTS = [
    ".agents/skills",
    ".cursor/skills",
    ".codex/skills",
    ".claude/skills",
    ".config/opencode/skills",
    ".opencode/skills",
    ".openclaw/skills",
    ".gemini/skills",
];
export function discoverSkills(inputPath, maxDepth = 8) {
    const target = resolve(inputPath);
    const skillFiles = findSkillMdFiles(target, maxDepth);
    return skillFiles.map((file) => loadSkill(file));
}
export function findSkillMdFiles(target, maxDepth = 8) {
    if (!existsSync(target))
        return [];
    const stats = statSync(target);
    if (stats.isFile()) {
        return basename(target) === "SKILL.md" ? [target] : [];
    }
    const direct = join(target, "SKILL.md");
    if (existsSync(direct) && statSync(direct).isFile()) {
        return [direct];
    }
    const found = [];
    walkForSkillMd(target, found, 0, maxDepth);
    return [...new Set(found)].sort();
}
function walkForSkillMd(dir, found, depth, maxDepth) {
    if (depth > maxDepth)
        return;
    let entries;
    try {
        entries = readdirSync(dir, { withFileTypes: true });
    }
    catch {
        return;
    }
    for (const entry of entries) {
        if (IGNORE_DIR_NAMES.has(entry.name))
            continue;
        const full = join(dir, entry.name);
        if (entry.isDirectory()) {
            walkForSkillMd(full, found, depth + 1, maxDepth);
            continue;
        }
        if (entry.isFile() && entry.name === "SKILL.md") {
            found.push(full);
        }
    }
}
export function listSkillFiles(root) {
    const files = [];
    collectTextFiles(root, root, files, 0, 6);
    return files;
}
function collectTextFiles(root, dir, files, depth, maxDepth) {
    if (depth > maxDepth)
        return;
    let entries;
    try {
        entries = readdirSync(dir, { withFileTypes: true });
    }
    catch {
        return;
    }
    for (const entry of entries) {
        if (IGNORE_DIR_NAMES.has(entry.name))
            continue;
        const full = join(dir, entry.name);
        if (entry.isDirectory()) {
            collectTextFiles(root, full, files, depth + 1, maxDepth);
            continue;
        }
        if (!entry.isFile())
            continue;
        const ext = extensionOf(entry.name);
        if (!TEXT_EXTENSIONS.has(ext) && entry.name !== "SKILL.md")
            continue;
        try {
            const content = readFileSync(full, "utf8");
            files.push({
                path: full,
                relativePath: toPosix(relative(root, full)),
                content,
            });
        }
        catch {
            // unreadable file
        }
    }
}
export function discoverInstalledSkills(cwd = process.cwd()) {
    const results = [];
    const roots = [
        ...HOME_SKILL_ROOTS.map((rel) => ({ label: `~/${rel.replaceAll("\\", "/")}`, path: join(homedir(), ...rel.split("/")) })),
        ...PROJECT_SKILL_ROOTS.map((rel) => ({ label: rel, path: join(cwd, ...rel.split("/")) })),
    ];
    for (const root of roots) {
        if (!existsSync(root.path))
            continue;
        for (const file of findSkillMdFiles(root.path, 3)) {
            results.push({ agentRoot: root.label, skill: loadSkill(file) });
        }
    }
    return results;
}
export function skillDisplayName(skill) {
    const name = skill.frontmatter.name;
    return typeof name === "string" && name.trim() ? name : skill.dirName;
}
function extensionOf(name) {
    const idx = name.lastIndexOf(".");
    return idx >= 0 ? name.slice(idx).toLowerCase() : "";
}
function toPosix(value) {
    return value.split(sep).join("/");
}
//# sourceMappingURL=discover.js.map