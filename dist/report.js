import { color } from "./color.js";
import { formatSarif } from "./sarif.js";
export function emptyReport(command) {
    return {
        ok: true,
        command,
        skills: [],
        summary: { skills: 0, errors: 0, warnings: 0, info: 0 },
    };
}
export function finalizeReport(command, skills) {
    const summary = { skills: skills.length, errors: 0, warnings: 0, info: 0 };
    for (const skill of skills) {
        for (const finding of skill.findings) {
            if (finding.severity === "error")
                summary.errors += 1;
            else if (finding.severity === "warning")
                summary.warnings += 1;
            else
                summary.info += 1;
        }
    }
    return {
        ok: summary.errors === 0,
        command,
        skills,
        summary,
    };
}
export function shouldFail(report, failOn) {
    if (failOn === "never")
        return false;
    if (failOn === "warning")
        return report.summary.errors > 0 || report.summary.warnings > 0;
    return report.summary.errors > 0;
}
export function formatReport(report, options) {
    if (options.format === "json") {
        return `${JSON.stringify(report, null, 2)}\n`;
    }
    if (options.format === "sarif") {
        return formatSarif(report);
    }
    if (options.quiet && report.ok && !shouldFail(report, options.failOn)) {
        return "";
    }
    const lines = [];
    lines.push(color.bold(`skilldoctor ${report.command}`) + color.dim(`  ${report.summary.skills} skill(s)`));
    lines.push("");
    if (report.skills.length === 0) {
        lines.push(color.yellow("No SKILL.md files found."));
        return `${lines.join("\n")}\n`;
    }
    for (const skill of report.skills) {
        const errors = skill.findings.filter((item) => item.severity === "error").length;
        const mark = errors > 0 ? color.red("✖") : color.green("✔");
        lines.push(`${mark} ${color.bold(skill.name)}  ${color.dim(skill.path)}`);
        for (const extraLine of formatExtra(skill)) {
            lines.push(`  ${color.dim(extraLine)}`);
        }
        for (const finding of skill.findings) {
            lines.push(`  ${formatFinding(finding)}`);
        }
        lines.push("");
    }
    const parts = [
        `${report.summary.skills} skills`,
        color.red(`${report.summary.errors} errors`),
        color.yellow(`${report.summary.warnings} warnings`),
        color.cyan(`${report.summary.info} info`),
    ];
    lines.push(parts.join("  "));
    return `${lines.join("\n")}\n`;
}
function formatFinding(finding) {
    const severity = finding.severity === "error"
        ? color.red("error")
        : finding.severity === "warning"
            ? color.yellow("warn")
            : color.cyan("info");
    const where = finding.line ? `:${finding.line}` : "";
    const file = finding.file ? color.dim(` ${finding.file}${where}`) : "";
    const hint = finding.hint ? `\n      ${color.dim(finding.hint)}` : "";
    return `${severity}  ${finding.rule}${file}  ${finding.message}${hint}`;
}
function formatExtra(skill) {
    if (!skill.extra)
        return [];
    if (skill.extra.matrix && typeof skill.extra.matrix === "object") {
        const matrix = skill.extra.matrix;
        return [
            Object.entries(matrix)
                .map(([agent, status]) => `${agent}=${status}`)
                .join("  "),
        ];
    }
    if (typeof skill.extra.location === "string") {
        return [`location ${skill.extra.location}`];
    }
    return [];
}
export function countBySeverity(findings) {
    return {
        errors: findings.filter((item) => item.severity === "error").length,
        warnings: findings.filter((item) => item.severity === "warning").length,
        info: findings.filter((item) => item.severity === "info").length,
    };
}
//# sourceMappingURL=report.js.map