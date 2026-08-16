import { appendFileSync, writeFileSync } from "node:fs";
import { runCi } from "./commands.js";
import { loadFileConfig, mergeIgnore, mergeSuppress } from "./config.js";
import { emitGitHubAnnotations } from "./github.js";
import { applySuppress, formatReport, shouldFail } from "./report.js";
import type { FailOn, Format } from "./types.js";

const path = process.env.INPUT_PATH || ".";
const failOn = parseFailOn(process.env.INPUT_FAIL_ON);
const format = parseFormat(process.env.INPUT_FORMAT);
const output = process.env.INPUT_OUTPUT?.trim();
const fileConfig = loadFileConfig(path);
const cliIgnore = splitList(process.env.INPUT_IGNORE);
const cliSuppress = splitList(process.env.INPUT_SUPPRESS);
const ignore = mergeIgnore(fileConfig.ignore, cliIgnore);
const suppress = mergeSuppress(fileConfig.suppress, cliSuppress);
const report = applySuppress(runCi(path, ignore), suppress);
const rendered = formatReport(report, { format, failOn, quiet: false, ignore, suppress });

process.stdout.write(rendered);
emitGitHubAnnotations(report);
if (output) writeFileSync(output, rendered, "utf8");

if (process.env.GITHUB_OUTPUT) {
  appendFileSync(
    process.env.GITHUB_OUTPUT,
    `errors=${report.summary.errors}\nwarnings=${report.summary.warnings}\nskills=${report.summary.skills}\nok=${report.ok}\n`,
  );
}

if (report.skills.length === 0 || shouldFail(report, failOn)) {
  process.exit(1);
}

function splitList(value: string | undefined): string[] {
  return (value || "")
    .split(/[, \n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseFailOn(value: string | undefined): FailOn {
  if (value === "warning" || value === "never" || value === "error") return value;
  return "error";
}

function parseFormat(value: string | undefined): Format {
  if (value === "json" || value === "sarif" || value === "markdown" || value === "human") return value;
  return "human";
}
