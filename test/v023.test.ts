import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { runLint, runScan } from "../src/commands.js";
import { isSuppressed, loadFileConfig } from "../src/config.js";
import { applySuppress } from "../src/report.js";
import { runScore } from "../src/score.js";

const fixtures = join(dirname(fileURLToPath(import.meta.url)), "fixtures");

describe("v0.2.3 suppress and fixes", () => {
  it("loads suppress from .skilldoctor.json", () => {
    const dir = mkdtempSync(join(tmpdir(), "skilldoctor-suppress-"));
    writeFileSync(
      join(dir, ".skilldoctor.json"),
      JSON.stringify({ suppress: ["lint/description-vague", "compat/*"] }),
      "utf8",
    );
    const config = loadFileConfig(dir);
    expect(config.suppress).toEqual(["lint/description-vague", "compat/*"]);
    rmSync(dir, { recursive: true, force: true });
  });

  it("matches suppress wildcards", () => {
    expect(isSuppressed("lint/description-vague", ["lint/*"])).toBe(true);
    expect(isSuppressed("audit/prompt-injection", ["lint/*"])).toBe(false);
    expect(isSuppressed("lint/name-invalid", ["lint/name-invalid"])).toBe(true);
  });

  it("filters findings and recalculates summary", () => {
    const report = runLint(join(fixtures, "vague-description"));
    expect(report.summary.warnings).toBeGreaterThan(0);
    const filtered = applySuppress(report, ["lint/description-vague"]);
    expect(filtered.skills[0]?.findings.some((item) => item.rule === "lint/description-vague")).toBe(false);
    expect(filtered.summary.warnings).toBeLessThan(report.summary.warnings);
  });

  it("score respects suppress when grading", () => {
    const raw = runScore(join(fixtures, "vague-description"));
    const muted = runScore(join(fixtures, "vague-description"), [], ["lint/description-vague"]);
    expect(muted.skills[0]?.score).toBeGreaterThanOrEqual(raw.skills[0]?.score ?? 0);
    expect(muted.skills[0]?.findings.some((item) => item.rule === "lint/description-vague")).toBe(false);
  });

  it("scan accepts ignore patterns by skill directory name", () => {
    const dir = mkdtempSync(join(tmpdir(), "skilldoctor-scan-"));
    const skillRoot = join(dir, ".agents", "skills", "keep-out");
    mkdirSync(skillRoot, { recursive: true });
    writeFileSync(
      join(skillRoot, "SKILL.md"),
      `---
name: keep-out
description: Keep out fixture. Use when testing scan ignore.
---

# Keep out
`,
      "utf8",
    );
    const withSkill = runScan(dir);
    expect(withSkill.skills.some((skill) => skill.name === "keep-out")).toBe(true);
    const ignored = runScan(dir, ["keep-out"]);
    expect(ignored.skills.some((skill) => skill.name === "keep-out")).toBe(false);
    rmSync(dir, { recursive: true, force: true });
  });

  it("score loads failOn from config when CLI omits it", () => {
    const dir = mkdtempSync(join(tmpdir(), "skilldoctor-score-cfg-"));
    writeFileSync(join(dir, ".skilldoctor.json"), JSON.stringify({ failOn: "never" }), "utf8");
    const config = loadFileConfig(dir);
    expect(config.failOn).toBe("never");
    rmSync(dir, { recursive: true, force: true });
  });
});
