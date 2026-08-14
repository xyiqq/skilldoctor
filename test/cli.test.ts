import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { runCi, runInit, runLint } from "../src/commands.js";
import { formatReport, shouldFail } from "../src/report.js";

describe("cli helpers", () => {
  it("fails CI when a fixture directory has errors", () => {
    const report = runCi(join(process.cwd(), "test/fixtures/invalid-name"));
    expect(shouldFail(report, "error")).toBe(true);
  });

  it("emits JSON reports", () => {
    const report = runLint(join(process.cwd(), "test/fixtures/valid-minimal"));
    const json = JSON.parse(formatReport(report, { format: "json", failOn: "error", quiet: false, ignore: [] }));
    expect(json.command).toBe("lint");
    expect(json.ok).toBe(true);
  });

  it("scaffolds a skill that passes lint", () => {
    const dir = mkdtempSync(join(tmpdir(), "skilldoctor-"));
    const created = runInit("demo-skill", dir);
    const report = runLint(created.path);
    expect(report.summary.errors).toBe(0);
    rmSync(dir, { recursive: true, force: true });
  });
});
