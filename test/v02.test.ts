import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { explainRule } from "../src/catalog.js";
import { loadFileConfig } from "../src/config.js";
import { runLint } from "../src/commands.js";
import { fixSkillText } from "../src/fix.js";
import { parseSkillMd } from "../src/parse.js";

function skillSource(name: string, extra = ""): string {
  return `---
name: ${name}
description: ${name} helper. Use when the user asks to run ${name}.
metadata:
  version: 1.0
${extra}---

# ${name}
`;
}

describe("v0.2.0 features", () => {
  it("explains a known rule", () => {
    const text = explainRule("lint/name-invalid");
    expect(text).toContain("lint/name-invalid");
    expect(text).toContain("lowercase");
  });

  it("quotes numeric frontmatter values", () => {
    const skill = parseSkillMd(skillSource("quote-meta"), "/tmp/quote-meta/SKILL.md");
    const result = fixSkillText(skill);
    expect(result.changes).toContain("quoted numeric frontmatter values");
    expect(result.next).toContain('version: "1.0"');
  });

  it("loads ignore patterns from config files", () => {
    const dir = mkdtempSync(join(tmpdir(), "skilldoctor-config-"));
    writeFileSync(join(dir, ".skilldoctor.json"), JSON.stringify({ ignore: ["vendor"] }), "utf8");
    writeFileSync(join(dir, ".skilldoctorignore"), "third-party\n", "utf8");
    const config = loadFileConfig(dir);
    expect(config.ignore).toContain("vendor");
    expect(config.ignore).toContain("third-party");
    rmSync(dir, { recursive: true, force: true });
  });

  it("warns when two skills share a name", () => {
    const dir = mkdtempSync(join(tmpdir(), "skilldoctor-dup-"));
    mkdirSync(join(dir, "one", "dup-skill"), { recursive: true });
    mkdirSync(join(dir, "two", "dup-skill"), { recursive: true });
    writeFileSync(join(dir, "one", "dup-skill", "SKILL.md"), skillSource("dup-skill"), "utf8");
    writeFileSync(join(dir, "two", "dup-skill", "SKILL.md"), skillSource("dup-skill"), "utf8");
    const report = runLint(dir);
    expect(report.skills.some((skill) => skill.findings.some((item) => item.rule === "lint/duplicate-name"))).toBe(true);
    rmSync(dir, { recursive: true, force: true });
  });
});
