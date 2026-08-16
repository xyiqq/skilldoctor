#!/usr/bin/env node
import { Command } from "commander";
import { writeFileSync } from "node:fs";
import { runAudit, runCi, runCompat, runInit, runLint, runScan } from "./commands.js";
import { explainRule, formatRuleCatalog } from "./catalog.js";
import {
  loadFileConfig,
  mergeIgnore,
  mergeSuppress,
  type FileConfig,
} from "./config.js";
import { runFix } from "./fix.js";
import { emitGitHubAnnotations } from "./github.js";
import { packageVersion } from "./package.js";
import { applySuppress, formatReport, shouldFail } from "./report.js";
import { formatScoreReport, runScore } from "./score.js";
import type { CliOptions, FailOn, Format, Report } from "./types.js";

const program = new Command();
const version = packageVersion();

program
  .name("skilldoctor")
  .description("Quality gate for Agent Skills: lint, audit, and cross-agent compatibility.")
  .version(version);

addPathCommand(program.command("lint"), "Validate SKILL.md against the Agent Skills spec", runLint);
addPathCommand(program.command("audit"), "Scan a skill for prompt injection, secrets, and unsafe tools", runAudit);
addPathCommand(program.command("compat"), "Check Claude / Cursor / Codex / OpenCode / Gemini / Copilot portability", runCompat);
addPathCommand(program.command("ci"), "Run lint, audit, and compat together", runCi);

program
  .command("scan")
  .alias("doctor")
  .description("Scan skills installed for local agents")
  .option("--format <format>", "human, json, sarif, or markdown", "human")
  .option("--fail-on <level>", "error, warning, or never", "error")
  .option("--ignore <pattern>", "skip matching skill paths (repeatable)", collectList, [])
  .option("--suppress <rule>", "hide matching rule IDs (repeatable, supports lint/*)", collectList, [])
  .option("--output <file>", "write the report to a file")
  .option("--quiet", "print nothing on success", false)
  .action((opts) => {
    const fileConfig = loadFileConfig(process.cwd());
    const options = readOptions(opts, fileConfig);
    exitWith(runScan(process.cwd(), options.ignore), options);
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
  .option("--ignore <pattern>", "skip matching skill paths (repeatable)", collectList, [])
  .option("--dry-run", "show fixes without writing files", false)
  .action((path: string, opts: Record<string, unknown>) => {
    const fileConfig = loadFileConfig(path);
    const cliIgnore = asStringList(opts.ignore);
    const dryRun = Boolean(opts.dryRun);
    const results = runFix(path, mergeIgnore(fileConfig.ignore, cliIgnore), dryRun);
    if (results.length === 0) {
      process.stdout.write("No auto-fixes applied.\n");
      return;
    }
    if (dryRun) process.stdout.write("Dry run — no files written.\n");
    for (const result of results) {
      process.stdout.write(`${result.path}\n  ${result.changes.join("\n  ")}\n`);
    }
  });

program
  .command("score")
  .description("Score skills from 0-100 with letter grades")
  .argument("[path]", "skill directory or repository root", ".")
  .option("--ignore <pattern>", "skip matching skill paths (repeatable)", collectList, [])
  .option("--suppress <rule>", "hide matching rule IDs (repeatable, supports lint/*)", collectList, [])
  .option("--format <format>", "human or json", "human")
  .option("--fail-on <level>", "error, warning, never, or score:<n>", "error")
  .option("--output <file>", "write the report to a file")
  .action((path: string, opts: Record<string, unknown>) => {
    const fileConfig = loadFileConfig(path);
    const ignore = mergeIgnore(fileConfig.ignore, asStringList(opts.ignore));
    const suppress = mergeSuppress(fileConfig.suppress, asStringList(opts.suppress));
    const report = runScore(path, ignore, suppress);
    const format = process.argv.includes("--format")
      ? opts.format === "json"
        ? "json"
        : "human"
      : fileConfig.format === "json"
        ? "json"
        : opts.format === "json"
          ? "json"
          : "human";
    const rendered =
      format === "json" ? `${JSON.stringify(report, null, 2)}\n` : formatScoreReport(report);
    process.stdout.write(rendered);
    const output = typeof opts.output === "string" ? opts.output.trim() : "";
    if (output) writeFileSync(output, rendered, "utf8");
    if (report.skills.length === 0) {
      process.exitCode = 1;
      return;
    }
    const failOn = process.argv.includes("--fail-on")
      ? typeof opts.failOn === "string"
        ? opts.failOn
        : "error"
      : typeof fileConfig.failOn === "string"
        ? fileConfig.failOn
        : typeof opts.failOn === "string"
          ? opts.failOn
          : "error";
    if (failOn.startsWith("score:")) {
      const min = Number(failOn.slice("score:".length));
      if (Number.isFinite(min) && report.average < min) process.exitCode = 1;
      return;
    }
    if (failOn === "never") return;
    if (failOn === "warning" && report.skills.some((skill) => skill.warnings > 0 || skill.errors > 0)) {
      process.exitCode = 1;
      return;
    }
    if (report.skills.some((skill) => skill.errors > 0)) process.exitCode = 1;
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
    .option("--format <format>", "human, json, sarif, or markdown", "human")
    .option("--fail-on <level>", "error, warning, or never", "error")
    .option("--ignore <pattern>", "skip matching skill paths (repeatable)", collectList, [])
    .option("--suppress <rule>", "hide matching rule IDs (repeatable, supports lint/*)", collectList, [])
    .option("--output <file>", "write the report to a file")
    .option("--quiet", "print nothing on success", false)
    .action((path: string, opts: Record<string, unknown>) => {
      const fileConfig = loadFileConfig(path);
      const options = readOptions(opts, fileConfig);
      const report = runner(path, options.ignore);
      exitWith(report, options);
    });
}

function collectList(value: string, previous: string[]): string[] {
  return [...previous, value];
}

function asStringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function readOptions(opts: Record<string, unknown>, fileConfig: FileConfig = { ignore: [], suppress: [] }): CliOptions {
  const format = process.argv.includes("--format")
    ? parseFormat(opts.format)
    : (fileConfig.format ?? parseFormat(opts.format));
  const failOn = process.argv.includes("--fail-on")
    ? parseFailOn(opts.failOn)
    : (fileConfig.failOn ?? parseFailOn(opts.failOn));
  const output = typeof opts.output === "string" && opts.output.trim() ? opts.output.trim() : undefined;
  return {
    format,
    failOn,
    quiet: Boolean(opts.quiet),
    ignore: mergeIgnore(fileConfig.ignore, asStringList(opts.ignore)),
    suppress: mergeSuppress(fileConfig.suppress, asStringList(opts.suppress)),
    output,
  };
}

function parseFormat(value: unknown): Format {
  if (value === "json" || value === "sarif" || value === "markdown" || value === "human") return value;
  return "human";
}

function parseFailOn(value: unknown): FailOn {
  if (value === "warning" || value === "never" || value === "error") return value;
  return "error";
}

function exitWith(report: Report, options: CliOptions): void {
  const filtered = applySuppress(report, options.suppress);
  const forFile = formatReport(filtered, { ...options, quiet: false });
  process.stdout.write(formatReport(filtered, options));
  if (options.output) writeFileSync(options.output, forFile, "utf8");
  emitGitHubAnnotations(filtered);
  if (filtered.skills.length === 0 && filtered.command !== "scan") {
    process.exitCode = 1;
    return;
  }
  process.exitCode = shouldFail(filtered, options.failOn) ? 1 : 0;
}
