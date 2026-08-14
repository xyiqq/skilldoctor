import { appendFileSync, writeFileSync } from "node:fs";
import { runCi } from "./commands.js";
import { loadFileConfig, mergeIgnore } from "./config.js";
import { emitGitHubAnnotations } from "./github.js";
import { formatReport, shouldFail } from "./report.js";
import type { FailOn, Format } from "./types.js";

const path = process.env.INPUT_PATH || ".";
const failOn = parseFailOn(process.env.INPUT_FAIL_ON);
const format = parseFormat(process.env.INPUT_FORMAT);
const output = process.env.INPUT_OUTPUT?.trim();
const cliIgnore = (process.env.INPUT_IGNORE || "")
  .split(/[, \n]/)
  .map((item) => item.trim())
  .filter(Boolean);
const ignore = mergeIgnore(loadFileConfig(path).ignore, cliIgnore);
const report = runCi(path, ignore);
const rendered = formatReport(report, { format, failOn, quiet: false, ignore });

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

function parseFailOn(value: string | undefined): FailOn {
  if (value === "warning" || value === "never" || value === "error") return value;
  return "error";
}

function parseFormat(value: string | undefined): Format {
  if (value === "json" || value === "sarif" || value === "human") return value;
  return "human";
}
