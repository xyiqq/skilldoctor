import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { runAudit } from "../src/commands.js";

const fixtures = join(dirname(fileURLToPath(import.meta.url)), "fixtures");

function rules(path: string): string[] {
  return runAudit(join(fixtures, path)).skills[0]?.findings.map((item) => item.rule) ?? [];
}

describe("audit", () => {
  it("does not flag a clean skill", () => {
    const report = runAudit(join(fixtures, "valid-minimal"));
    expect(report.summary.errors).toBe(0);
  });

  it("detects prompt injection", () => {
    expect(rules("audit-injection")).toContain("audit/prompt-injection");
  });

  it("detects a well-known test secret", () => {
    expect(rules("audit-secret")).toContain("audit/hardcoded-secret");
  });

  it("detects unconstrained Bash(*)", () => {
    expect(rules("audit-bash-star")).toContain("audit/unconstrained-tools");
  });

  it("detects exfiltration hosts", () => {
    expect(rules("audit-exfil")).toContain("audit/exfil-network");
  });

  it("detects curl piped to a shell", () => {
    expect(rules("audit-pipe-shell")).toContain("audit/pipe-to-shell");
  });

  it("detects an instruction to read SSH keys", () => {
    expect(rules("audit-credential-read")).toContain("audit/credential-path");
  });

  it("does not flag a do-not-commit .env warning", () => {
    expect(rules("audit-env-warning")).not.toContain("audit/credential-path");
  });
});
