#!/usr/bin/env node
import { Command } from "commander";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runAudit, runCi, runCompat, runInit, runLint, runScan } from "./commands.js";
import { formatRuleCatalog } from "./catalog.js";
import { emitGitHubAnnotations } from "./github.js";
import { formatReport, shouldFail } from "./report.js";
import type { CliOptions, FailOn, Format, Report } from "./types.js";

const program = new Command();
const pkg = readPackage();

program
  .name("skilldoctor")
  .description("Quality gate for Agent Skills: lint, audit, and cross-agent compatibility.")
  .version(pkg.version);

addPathCommand(program.command("lint"), "Validate SKILL.md against the Agent Skills spec", runLint);
addPathCommand(program.command("audit"), "Scan a skill for prompt injection, secrets, and unsafe tools", runAudit);
addPathCommand(program.command("compat"), "Check Claude / Cursor / Codex / OpenCode portability", runCompat);
addPathCommand(program.command("ci"), "Run lint, audit, and compat together", runCi);

program
  .command("scan")
  .alias("doctor")
  .description("Scan skills installed for local agents")
  .option("--format <format>", "human or json", "human")
  .option("--fail-on <level>", "error, warning, or never", "error")
  .option("--quiet", "print nothing on success", false)
  .action((opts) => {
    exitWith(runScan(process.cwd()), readOptions(opts));
  });

program
  .command("init")
  .description("Scaffold a spec-compliant skill directory")
  .argument("<name>", "skill directory name, for example pdf-processing")
  .action((name: string) => {
    try {
      const result = runInit(name, process.cwd());
      process.stdout.write(`Created ${result.path}\n`);
    } catch (error) {
      process.stderr.write(`${error instanceof Error ? error.message : error}\n`);
      process.exitCode = 1;
    }
  });

program
  .command("rules")
  .description("List built-in lint, audit, compat, and scan rule IDs")
  .action(() => {
    process.stdout.write(formatRuleCatalog());
  });

program.parse();

function addPathCommand(
  command: Command,
  description: string,
  runner: (path: string) => Report,
): void {
  command
    .description(description)
    .argument("[path]", "skill directory or repository root", ".")
    .option("--format <format>", "human or json", "human")
    .option("--fail-on <level>", "error, warning, or never", "error")
    .option("--quiet", "print nothing on success", false)
    .action((path: string, opts: Record<string, unknown>) => {
      const options = readOptions(opts);
      const report = runner(path);
      exitWith(report, options);
    });
}

function readOptions(opts: Record<string, unknown>): CliOptions {
  const format = opts.format === "json" ? "json" : "human";
  const failOn = parseFailOn(opts.failOn);
  return {
    format: format as Format,
    failOn,
    quiet: Boolean(opts.quiet),
  };
}

function parseFailOn(value: unknown): FailOn {
  if (value === "warning" || value === "never" || value === "error") return value;
  return "error";
}

function exitWith(report: Report, options: CliOptions): void {
  process.stdout.write(formatReport(report, options));
  emitGitHubAnnotations(report);
  if (report.skills.length === 0 && report.command !== "scan") {
    process.exitCode = 1;
    return;
  }
  process.exitCode = shouldFail(report, options.failOn) ? 1 : 0;
}

function readPackage(): { version: string } {
  const here = dirname(fileURLToPath(import.meta.url));
  const candidates = [join(here, "../package.json"), join(here, "../../package.json")];
  for (const file of candidates) {
    try {
      return JSON.parse(readFileSync(file, "utf8")) as { version: string };
    } catch {
      // try next
    }
  }
  return { version: "0.0.0" };
}
