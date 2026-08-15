import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { runCi, runLint } from "../src/commands.js";
import { formatReport } from "../src/report.js";

const fixtures = join(dirname(fileURLToPath(import.meta.url)), "fixtures");
const root = join(dirname(fileURLToPath(import.meta.url)), "..");

describe("v0.1.2 ignore and sarif", () => {
  it("honors --ignore prefixes", () => {
    const report = runLint(root, ["examples"]);
    expect(report.skills.some((skill) => skill.path.includes("release-notes"))).toBe(false);
  });

  it("emits SARIF 2.1 results for findings", () => {
    const report = runCi(join(fixtures, "invalid-name"));
    const sarif = JSON.parse(
      formatReport(report, { format: "sarif", failOn: "error", quiet: false, ignore: [], suppress: [] }),
    );
    expect(sarif.version).toBe("2.1.0");
    expect(sarif.runs[0].results.length).toBeGreaterThan(0);
    expect(sarif.runs[0].results[0].ruleId).toMatch(/^lint\//);
  });
});
