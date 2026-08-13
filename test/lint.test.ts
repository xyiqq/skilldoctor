import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { runLint } from "../src/commands.js";

const fixtures = join(dirname(fileURLToPath(import.meta.url)), "fixtures");

describe("lint", () => {
  it("accepts a minimal valid skill", () => {
    const report = runLint(join(fixtures, "valid-minimal"));
    expect(report.summary.errors).toBe(0);
    expect(report.ok).toBe(true);
  });

  it("accepts a full skill with references and scripts", () => {
    const report = runLint(join(fixtures, "valid-full"));
    expect(report.summary.errors).toBe(0);
  });

  it("rejects an invalid name and directory mismatch", () => {
    const report = runLint(join(fixtures, "invalid-name"));
    const rules = report.skills[0]?.findings.map((item) => item.rule) ?? [];
    expect(rules).toContain("lint/name-invalid");
    expect(rules).toContain("lint/name-dir-mismatch");
  });

  it("rejects a missing description", () => {
    const report = runLint(join(fixtures, "missing-description"));
    expect(report.skills[0]?.findings.some((item) => item.rule === "lint/description-missing")).toBe(true);
  });

  it("warns on a vague first-person-free but shallow description", () => {
    const report = runLint(join(fixtures, "vague-description"));
    expect(report.skills[0]?.findings.some((item) => item.rule === "lint/description-vague")).toBe(true);
  });

  it("rejects a broken relative reference", () => {
    const report = runLint(join(fixtures, "broken-ref"));
    expect(report.skills[0]?.findings.some((item) => item.rule === "lint/broken-reference")).toBe(true);
  });
});
