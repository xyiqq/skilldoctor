import { runCi } from "./commands.js";
import { emitGitHubAnnotations } from "./github.js";
import { formatReport, shouldFail } from "./report.js";
const path = process.env.INPUT_PATH || ".";
const failOn = parseFailOn(process.env.INPUT_FAIL_ON);
const report = runCi(path);
process.stdout.write(formatReport(report, { format: "human", failOn, quiet: false, ignore: [] }));
emitGitHubAnnotations(report);
if (process.env.GITHUB_OUTPUT) {
    const { appendFileSync } = await import("node:fs");
    appendFileSync(process.env.GITHUB_OUTPUT, `errors=${report.summary.errors}\nwarnings=${report.summary.warnings}\nskills=${report.summary.skills}\nok=${report.ok}\n`);
}
if (report.skills.length === 0 || shouldFail(report, failOn)) {
    process.exit(1);
}
function parseFailOn(value) {
    if (value === "warning" || value === "never" || value === "error")
        return value;
    return "error";
}
//# sourceMappingURL=action.js.map