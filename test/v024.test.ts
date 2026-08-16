import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { runCi } from "../src/commands.js";
import { packageVersion } from "../src/package.js";
import { formatReport } from "../src/report.js";
import { formatSarif } from "../src/sarif.js";

const fixtures = join(dirname(fileURLToPath(import.meta.url)), "fixtures");
const root = join(dirname(fileURLToPath(import.meta.url)), "..");

describe("v0.2.4 output and sarif version", () => {
  it("embeds the package version in SARIF driver metadata", () => {
    const report = runCi(join(fixtures, "invalid-name"));
    const sarif = JSON.parse(formatSarif(report));
    expect(sarif.runs[0].tool.driver.version).toBe(packageVersion());
    expect(sarif.runs[0].tool.driver.version).not.toBe("0.2.2");
    expect(packageVersion()).toBe("0.2.4");
  });

  it("writes reports with --output even when stdout is quiet", () => {
    const dir = mkdtempSync(join(tmpdir(), "skilldoctor-out-"));
    const out = join(dir, "report.md");
    const tsx = join(root, "node_modules", "tsx", "dist", "cli.mjs");
    expect(existsSync(tsx)).toBe(true);
    const stdout = execFileSync(
      process.execPath,
      [tsx, join(root, "src", "cli.ts"), "ci", join(root, "examples"), "--format", "markdown", "--quiet", "--output", out],
      { cwd: root, encoding: "utf8" },
    );
    expect(stdout).toBe("");
    const saved = readFileSync(out, "utf8");
    expect(saved).toContain("## skilldoctor ci");
    expect(saved).toContain("release-notes");
    rmSync(dir, { recursive: true, force: true });
  });

  it("quiet suppresses non-human formats on success", () => {
    const report = runCi(join(root, "examples"));
    const md = formatReport(report, {
      format: "markdown",
      failOn: "error",
      quiet: true,
      ignore: [],
      suppress: [],
    });
    expect(md).toBe("");
  });

  it("can render reports that callers write via --output", () => {
    const dir = mkdtempSync(join(tmpdir(), "skilldoctor-out2-"));
    const report = runCi(join(root, "examples"));
    const rendered = formatReport(report, {
      format: "markdown",
      failOn: "error",
      quiet: false,
      ignore: [],
      suppress: [],
    });
    const file = join(dir, "report.md");
    writeFileSync(file, rendered, "utf8");
    const saved = readFileSync(file, "utf8");
    expect(saved).toContain("## skilldoctor ci");
    expect(saved).toContain("release-notes");
    rmSync(dir, { recursive: true, force: true });
  });
});
