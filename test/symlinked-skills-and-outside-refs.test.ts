import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, describe, expect, it } from "vitest";
import { findSkillMdFiles } from "../src/discover.js";
import { runLint } from "../src/commands.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const fixtures = join(root, "test/fixtures");
const temps: string[] = [];

function tempRoot(): string {
  const dir = mkdtempSync(join(tmpdir(), "skilldoctor-symlink-"));
  temps.push(dir);
  return dir;
}

afterAll(() => {
  for (const dir of temps) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe("skills installed as symlinks", () => {
  it("finds a skill whose directory is a symlink", () => {
    const home = tempRoot();
    try {
      symlinkSync(join(fixtures, "valid-full"), join(home, "valid-full"), "dir");
    } catch {
      return; // symlink creation is privileged on some platforms
    }

    const found = findSkillMdFiles(home);
    expect(found).toHaveLength(1);
    expect(found[0]).toContain("valid-full");
  });

  it("lints a symlinked skill instead of skipping it silently", () => {
    const home = tempRoot();
    try {
      symlinkSync(join(fixtures, "broken-ref"), join(home, "broken-ref"), "dir");
    } catch {
      return;
    }

    const report = runLint(home);
    expect(report.summary.skills).toBe(1);
    expect(report.skills[0]?.findings.some((item) => item.rule === "lint/broken-reference")).toBe(true);
  });

  it("resolves a symlinked skill's own relative references against its real location", () => {
    const home = tempRoot();
    const pkg = tempRoot();
    mkdirSync(join(pkg, "docs"), { recursive: true });
    mkdirSync(join(pkg, "skills", "linked-skill"), { recursive: true });
    writeFileSync(join(pkg, "docs", "notes.md"), "# Notes\n", "utf8");
    writeFileSync(
      join(pkg, "skills", "linked-skill", "SKILL.md"),
      [
        "---",
        "name: linked-skill",
        "description: Ships alongside package docs one level above the skills directory. Use when the user asks to test symlinked installs.",
        "---",
        "",
        "# Linked Skill",
        "",
        "See [package notes](../../docs/notes.md).",
        "",
      ].join("\n"),
      "utf8",
    );

    try {
      symlinkSync(join(pkg, "skills", "linked-skill"), join(home, "linked-skill"), "dir");
    } catch {
      return;
    }

    const report = runLint(home);
    expect(report.summary.skills).toBe(1);
    const broken = report.skills[0]?.findings.filter((item) => item.rule === "lint/broken-reference") ?? [];
    expect(broken).toHaveLength(0);
  });

  it("does not loop when a symlink points at an ancestor directory", () => {
    const home = tempRoot();
    try {
      symlinkSync(join(fixtures, "valid-full"), join(home, "valid-full"), "dir");
      symlinkSync(home, join(home, "loop"), "dir");
    } catch {
      return;
    }

    const found = findSkillMdFiles(home);
    expect(found.length).toBeGreaterThan(0);
  });
});

describe("references that do not belong to the skill", () => {
  it("ignores home-anchored, sibling and glob-shaped paths", () => {
    const report = runLint(join(fixtures, "refs-outside-skill"));
    const broken = report.skills[0]?.findings.filter((item) => item.rule === "lint/broken-reference") ?? [];
    expect(broken).toHaveLength(0);
  });

  it("still reports a genuinely missing skill-relative reference", () => {
    const report = runLint(join(fixtures, "broken-ref"));
    const broken = report.skills[0]?.findings.filter((item) => item.rule === "lint/broken-reference") ?? [];
    expect(broken).toHaveLength(1);
    expect(broken[0]?.message).toContain("references/MISSING.md");
  });
});
