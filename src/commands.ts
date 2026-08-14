import { lstatSync, mkdirSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, resolve } from "node:path";
import { discoverInstalledSkills, discoverSkills, skillDisplayName } from "./discover.js";
import { emptyReport, finalizeReport } from "./report.js";
import { allChecks, auditSkill, compatSkill, lintSkill } from "./run.js";
import type { Report, SkillDocument } from "./types.js";

export function runLint(path: string, ignore: string[] = []): Report {
  return withDuplicateNames(collect("lint", path, lintSkill, ignore));
}

export function runAudit(path: string, ignore: string[] = []): Report {
  return collect("audit", path, auditSkill, ignore);
}

export function runCompat(path: string, ignore: string[] = []): Report {
  return collect("compat", path, compatSkill, ignore);
}

export function runCi(path: string, ignore: string[] = []): Report {
  return withDuplicateNames(collect("ci", path, allChecks, ignore));
}

export function runScan(cwd = process.cwd()): Report {
  const installed = discoverInstalledSkills(cwd);
  if (installed.length === 0) {
    return emptyReport("scan");
  }

  const byName = new Map<string, string[]>();
  const reports = installed.map(({ agentRoot, skill }) => {
    const report = allChecks(skill);
    const name = skillDisplayName(skill);
    const bucket = byName.get(name) ?? [];
    bucket.push(agentRoot);
    byName.set(name, bucket);
    report.extra = {
      ...(report.extra ?? {}),
      location: agentRoot,
      hash: hashSkill(skill),
      symlink: isSymlink(skill.root),
    };
    if (report.extra.symlink && process.platform === "win32") {
      report.findings.push({
        rule: "scan/windows-symlink",
        severity: "warning",
        message: "skill is installed as a symlink; Windows agents often fail to follow these",
        file: "SKILL.md",
        hint: "Copy the skill directory instead of symlinking it on Windows.",
      });
    }
    return report;
  });

  for (const report of reports) {
    const locations = byName.get(report.name) ?? [];
    if (locations.length > 1) {
      report.findings.push({
        rule: "scan/duplicate-name",
        severity: "warning",
        message: `skill name "${report.name}" is installed in multiple locations: ${locations.join(", ")}`,
        file: "SKILL.md",
      });
    }
  }

  return finalizeReport("scan", reports);
}

export function runInit(name: string, cwd = process.cwd()): { path: string } {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name) || name.length > 64) {
    throw new Error("Skill name must be 1-64 lowercase alphanumeric characters with single hyphens.");
  }

  const root = resolve(cwd, name);
  mkdirSync(join(root, "references"), { recursive: true });
  mkdirSync(join(root, "scripts"), { recursive: true });
  writeFileSync(join(root, "SKILL.md"), renderSkillTemplate(name), "utf8");
  writeFileSync(join(root, "references", "NOTES.md"), `# ${name} notes\n\nAdd long-form reference material here.\n`, "utf8");
  writeFileSync(
    join(root, "scripts", "hello.sh"),
    `#!/bin/sh\nset -eu\nprintf 'skilldoctor scaffold ok\\n'\n`,
    "utf8",
  );
  return { path: root };
}

function collect(
  command: string,
  path: string,
  toReport: (skill: SkillDocument) => ReturnType<typeof lintSkill>,
  ignore: string[] = [],
): Report {
  const skills = discoverSkills(path, 8, ignore);
  if (skills.length === 0) {
    return emptyReport(command);
  }
  return finalizeReport(command, skills.map(toReport));
}

function withDuplicateNames(report: Report): Report {
  const byName = new Map<string, string[]>();
  for (const skill of report.skills) {
    const paths = byName.get(skill.name) ?? [];
    paths.push(skill.path);
    byName.set(skill.name, paths);
  }
  for (const skill of report.skills) {
    const paths = byName.get(skill.name) ?? [];
    if (paths.length < 2) continue;
    skill.findings.push({
      rule: "lint/duplicate-name",
      severity: "warning",
      message: `skill name "${skill.name}" appears ${paths.length} times`,
      file: "SKILL.md",
      hint: paths.join(", "),
    });
  }
  return finalizeReport(report.command, report.skills);
}

function isSymlink(path: string): boolean {
  try {
    return lstatSync(path).isSymbolicLink();
  } catch {
    return false;
  }
}

function hashSkill(skill: SkillDocument): string {
  return createHash("sha256").update(skill.raw).digest("hex").slice(0, 12);
}

function renderSkillTemplate(name: string): string {
  const title = name
    .split("-")
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ");
  return `---
name: ${name}
description: ${title} workflow helper. Use when the user asks to run the ${name} workflow or mentions ${name}.
license: MIT
metadata:
  author: local
  version: "0.1.0"
---

# ${title}

## Quick start

1. Confirm the user wants the ${name} workflow.
2. Follow the steps below.
3. Read [references/NOTES.md](references/NOTES.md) only if you need extra detail.

## Steps

1. Restate the goal in one sentence.
2. Do the smallest change that finishes the task.
3. Report what changed.

## Scripts

Optional helper:

\`\`\`bash
sh scripts/hello.sh
\`\`\`
`;
}
