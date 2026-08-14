import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { basename, join, relative, resolve, sep } from "node:path";
import { loadSkill } from "./parse.js";
import { IGNORE_DIR_NAMES, type SkillDocument, type SkillFile } from "./types.js";

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
  ".github/skills",
  ".copilot/skills",
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
  ".copilot/skills",
];

export function discoverSkills(inputPath: string, maxDepth = 8, ignore: string[] = []): SkillDocument[] {
  const target = resolve(inputPath);
  const skillFiles = findSkillMdFiles(target, maxDepth).filter((file) => !isIgnored(target, file, ignore));
  return skillFiles.map((file) => loadSkill(file));
}

export function findSkillMdFiles(target: string, maxDepth = 8): string[] {
  if (!existsSync(target)) return [];

  const stats = statSync(target);
  if (stats.isFile()) {
    return basename(target) === "SKILL.md" ? [target] : [];
  }

  const direct = join(target, "SKILL.md");
  if (existsSync(direct) && statSync(direct).isFile()) {
    return [direct];
  }

  const found: string[] = [];
  walkForSkillMd(target, found, 0, maxDepth);
  return [...new Set(found)].sort();
}

function walkForSkillMd(dir: string, found: string[], depth: number, maxDepth: number): void {
  if (depth > maxDepth) return;

  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    if (IGNORE_DIR_NAMES.has(entry.name) || isTestFixtureDir(dir, entry.name)) continue;
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

export function listSkillFiles(root: string): SkillFile[] {
  const files: SkillFile[] = [];
  collectTextFiles(root, root, files, 0, 6);
  return files;
}

function collectTextFiles(
  root: string,
  dir: string,
  files: SkillFile[],
  depth: number,
  maxDepth: number,
): void {
  if (depth > maxDepth) return;
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    if (IGNORE_DIR_NAMES.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      collectTextFiles(root, full, files, depth + 1, maxDepth);
      continue;
    }
    if (!entry.isFile()) continue;
    const ext = extensionOf(entry.name);
    if (!TEXT_EXTENSIONS.has(ext) && entry.name !== "SKILL.md") continue;
    try {
      const content = readFileSync(full, "utf8");
      files.push({
        path: full,
        relativePath: toPosix(relative(root, full)),
        content,
      });
    } catch {
      // unreadable file
    }
  }
}

export function discoverInstalledSkills(cwd = process.cwd()): Array<{
  agentRoot: string;
  skill: SkillDocument;
}> {
  const results: Array<{ agentRoot: string; skill: SkillDocument }> = [];
  const roots = [
    ...HOME_SKILL_ROOTS.map((rel) => ({ label: `~/${rel.replaceAll("\\", "/")}`, path: join(homedir(), ...rel.split("/")) })),
    ...PROJECT_SKILL_ROOTS.map((rel) => ({ label: rel, path: join(cwd, ...rel.split("/")) })),
  ];

  for (const root of roots) {
    if (!existsSync(root.path)) continue;
    for (const file of findSkillMdFiles(root.path, 3)) {
      results.push({ agentRoot: root.label, skill: loadSkill(file) });
    }
  }

  return results;
}

export function skillDisplayName(skill: SkillDocument): string {
  const name = skill.frontmatter.name;
  return typeof name === "string" && name.trim() ? name : skill.dirName;
}

function extensionOf(name: string): string {
  const idx = name.lastIndexOf(".");
  return idx >= 0 ? name.slice(idx).toLowerCase() : "";
}

function toPosix(value: string): string {
  return value.split(sep).join("/");
}

function isTestFixtureDir(parentDir: string, entryName: string): boolean {
  return entryName === "fixtures" && basename(parentDir) === "test";
}

export function isIgnored(scanRoot: string, skillMdPath: string, patterns: string[]): boolean {
  if (patterns.length === 0) return false;
  const rel = toPosix(relative(scanRoot, skillMdPath));
  return patterns.some((pattern) => matchIgnore(rel, pattern));
}

function matchIgnore(relPosix: string, pattern: string): boolean {
  const normalized = pattern.replaceAll("\\", "/").replace(/^\.\//, "").replace(/\/$/, "");
  const parent = relPosix.includes("/") ? relPosix.slice(0, relPosix.lastIndexOf("/")) : "";
  if (!normalized.includes("*")) {
    return (
      relPosix === normalized ||
      relPosix.startsWith(`${normalized}/`) ||
      parent === normalized ||
      parent.startsWith(`${normalized}/`) ||
      basename(parent) === normalized
    );
  }
  const regex = new RegExp(
    `^${normalized
      .split("/")
      .map((part) => {
        if (part === "**") return ".*";
        return part.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, "[^/]*");
      })
      .join("/")}$`,
  );
  return regex.test(relPosix) || regex.test(parent);
}
