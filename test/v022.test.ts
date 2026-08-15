import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { runAudit, runCi } from "../src/commands.js";
import { fixSkillText } from "../src/fix.js";
import { parseSkillMd } from "../src/parse.js";
import { formatReport } from "../src/report.js";
import { runScore } from "../src/score.js";

const fixtures = join(dirname(fileURLToPath(import.meta.url)), "fixtures");
const root = join(dirname(fileURLToPath(import.meta.url)), "..");

describe("v0.2.2 features", () => {
  it("scores a clean example highly", () => {
    const report = runScore(join(root, "examples"));
    expect(report.skills.length).toBe(1);
    expect(report.average).toBeGreaterThanOrEqual(90);
    expect(report.grade).toBe("A");
  });

  it("scores a broken skill lower", () => {
    const report = runScore(join(fixtures, "invalid-name"));
    expect(report.skills[0]?.score).toBeLessThan(90);
    expect(["B", "C", "D", "F"]).toContain(report.skills[0]?.grade);
  });

  it("emits markdown reports", () => {
    const report = runCi(join(fixtures, "invalid-name"));
    const md = formatReport(report, { format: "markdown", failOn: "error", quiet: false, ignore: [], suppress: [] });
    expect(md).toContain("## skilldoctor ci");
    expect(md).toContain("| Severity | Rule | Location | Message |");
    expect(md).toContain("lint/name-invalid");
  });

  it("supports dry-run fixes without writing", () => {
    const skill = parseSkillMd(
      `---
name: dry-run-demo
description: Dry run demo. Use when testing fix --dry-run.
metadata:
  version: 1.0
---

# Demo
`,
      "/tmp/dry-run-demo/SKILL.md",
    );
    const result = fixSkillText(skill);
    expect(result.changes.length).toBeGreaterThan(0);
    expect(result.next).toContain('version: "1.0"');
  });

  it("detects insecure HTTP downloads", () => {
    const rules = runAudit(join(fixtures, "audit-insecure-http")).skills[0]?.findings.map((item) => item.rule) ?? [];
    expect(rules).toContain("audit/insecure-http");
  });
});
