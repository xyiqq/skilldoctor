#!/usr/bin/env node
import { Command } from "commander";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runAudit, runCi, runCompat, runInit, runLint, runScan } from "./commands.js";
import { explainRule, formatRuleCatalog } from "./catalog.js";
import { loadFileConfig, mergeIgnore, type FileConfig } from "./config.js";
import { runFix } from "./fix.js";
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
addPathCommand(program.command("compat"), "Check Claude / Cursor / Codex / OpenCode / Gemini / Copilot portability", runCompat);
addPathCommand(program.command("ci"), "Run lint, audit, and compat together", runCi);

program
  .command("scan")
  .alias("doctor")
  .description("Scan skills installed for local agents")
  .option("--format <format>", "human, json, or sarif", "human")
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

program
  .command("explain")
  .description("Explain a rule ID")
  .argument("<rule>", "rule id, for example lint/name-invalid")
  .action((rule: string) => {
    const text = explainRule(rule);
    process.stdout.write(text);
    if (text.startsWith("Unknown") || text.startsWith("Ambiguous")) process.exitCode = 1;
  });

program
  .command("fix")
  .description("Apply safe auto-fixes: quote numeric metadata, POSIX paths, trailing newline")
  .argument("[path]", "skill directory or repository root", ".")
  .option("--ignore <pattern>", "skip matching skill paths (repeatable)", collectIgnore, [])
  .action((path: string, opts: Record<string, unknown>) => {
    const fileConfig = loadFileConfig(path);
    const cliIgnore = Array.isArray(opts.ignore)
      ? opts.ignore.filter((item): item is string => typeof item === "string")
      : [];
    const results = runFix(path, mergeIgnore(fileConfig.ignore, cliIgnore));
    if (results.length === 0) {
      process.stdout.write("No auto-fixes applied.\n");
      return;
    }
    for (const result of results) {
      process.stdout.write(`${result.path}\n  ${result.changes.join("\n  ")}\n`);
    }
  });

program.parse();

function addPathCommand(
  command: Command,
  description: string,
  runner: (path: string, ignore?: string[]) => Report,
): void {
  command
    .description(description)
    .argument("[path]", "skill directory or repository root", ".")
    .option("--format <format>", "human, json, or sarif", "human")
    .option("--fail-on <level>", "error, warning, or never", "error")
    .option("--ignore <pattern>", "skip matching skill paths (repeatable)", collectIgnore, [])
    .option("--quiet", "print nothing on success", false)
    .action((path: string, opts: Record<string, unknown>) => {
      const fileConfig = loadFileConfig(path);
      const options = readOptions(opts, fileConfig);
      const report = runner(path, options.ignore);
      exitWith(report, options);
    });
}

function collectIgnore(value: string, previous: string[]): string[] {
  return [...previous, value];
}

function readOptions(opts: Record<string, unknown>, fileConfig: FileConfig = { ignore: [] }): CliOptions {
  const format = process.argv.includes("--format")
    ? parseFormat(opts.format)
    : (fileConfig.format ?? parseFormat(opts.format));
  const failOn = process.argv.includes("--fail-on")
    ? parseFailOn(opts.failOn)
    : (fileConfig.failOn ?? parseFailOn(opts.failOn));
  const cliIgnore = Array.isArray(opts.ignore)
    ? opts.ignore.filter((item): item is string => typeof item === "string")
    : [];
  return {
    format: format === "json" || format === "sarif" ? format : "human",
    failOn,
    quiet: Boolean(opts.quiet),
    ignore: mergeIgnore(fileConfig.ignore, cliIgnore),
  };
}

function parseFormat(value: unknown): Format {
  if (value === "json" || value === "sarif" || value === "human") return value;
  return "human";
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
