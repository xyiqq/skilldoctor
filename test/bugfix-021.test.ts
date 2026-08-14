import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { runInit, runLint } from "../src/commands.js";
import { loadFileConfig } from "../src/config.js";
import { isIgnored } from "../src/discover.js";
import { resolveFindingPath } from "../src/github.js";

describe("v0.2.1 bugfixes", () => {
  it("does not wipe ignore when JSON omits ignore", () => {
    const dir = mkdtempSync(join(tmpdir(), "skilldoctor-cfg-"));
    writeFileSync(join(dir, ".skilldoctor.json"), JSON.stringify({ failOn: "warning" }), "utf8");
    writeFileSync(join(dir, ".skilldoctorignore"), "vendor\n", "utf8");
    const config = loadFileConfig(dir);
    expect(config.failOn).toBe("warning");
    expect(config.ignore).toContain("vendor");
    rmSync(dir, { recursive: true, force: true });
  });

  it("refuses to overwrite an existing skill on init", () => {
    const dir = mkdtempSync(join(tmpdir(), "skilldoctor-init-"));
    runInit("keep-me", dir);
    expect(() => runInit("keep-me", dir)).toThrow(/Refusing to overwrite/);
    expect(existsSync(join(dir, "keep-me", "SKILL.md"))).toBe(true);
    rmSync(dir, { recursive: true, force: true });
  });

  it("resolves relative finding paths against the skill directory", () => {
    expect(resolveFindingPath("/repo/skills/demo", "SKILL.md")).toBe(join("/repo/skills/demo", "SKILL.md"));
    expect(resolveFindingPath("/repo/skills/demo", "/abs/SKILL.md")).toBe("/abs/SKILL.md");
  });

  it("matches ignore patterns against the skill directory basename", () => {
    const root = "/repo";
    const skill = "/repo/examples/release-notes/SKILL.md";
    expect(isIgnored(root, skill, ["release-notes"])).toBe(true);
    expect(isIgnored(root, skill, ["examples"])).toBe(true);
    expect(isIgnored(root, skill, ["other"])).toBe(false);
  });

  it("does not duplicate lint/duplicate-name findings", () => {
    const dir = mkdtempSync(join(tmpdir(), "skilldoctor-dup2-"));
    mkdirSync(join(dir, "a", "same-name"), { recursive: true });
    mkdirSync(join(dir, "b", "same-name"), { recursive: true });
    const body = `---
name: same-name
description: Same name fixture. Use when testing duplicate-name dedupe.
---

# Same
`;
    writeFileSync(join(dir, "a", "same-name", "SKILL.md"), body, "utf8");
    writeFileSync(join(dir, "b", "same-name", "SKILL.md"), body, "utf8");
    const report = runLint(dir);
    for (const skill of report.skills) {
      const dups = skill.findings.filter((item) => item.rule === "lint/duplicate-name");
      expect(dups.length).toBe(1);
    }
    rmSync(dir, { recursive: true, force: true });
  });
});
