import { color } from "./color.js";
import { isSuppressed } from "./config.js";
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
export function applySuppress(report, suppress) {
    if (suppress.length === 0)
        return report;
    const skills = report.skills.map((skill) => ({
        ...skill,
        findings: skill.findings.filter((finding) => !isSuppressed(finding.rule, suppress)),
    }));
    return finalizeReport(report.command, skills);
}
export function shouldFail(report, failOn) {
    if (failOn === "never")
        return false;
    if (failOn === "warning")
        return report.summary.errors > 0 || report.summary.warnings > 0;
    return report.summary.errors > 0;
}
export function formatReport(report, options) {
    if (options.quiet && report.ok && !shouldFail(report, options.failOn)) {
        return "";
    }
    if (options.format === "json") {
        return `${JSON.stringify(report, null, 2)}\n`;
    }
    if (options.format === "sarif") {
        return formatSarif(report);
    }
    if (options.format === "markdown") {
        return formatMarkdown(report);
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
export function formatMarkdown(report) {
    const lines = [
        `## skilldoctor ${report.command}`,
        "",
        `| Skills | Errors | Warnings | Info |`,
        `| --- | --- | --- | --- |`,
        `| ${report.summary.skills} | ${report.summary.errors} | ${report.summary.warnings} | ${report.summary.info} |`,
        "",
    ];
    if (report.skills.length === 0) {
        lines.push("No `SKILL.md` files found.");
        lines.push("");
        return `${lines.join("\n")}\n`;
    }
    for (const skill of report.skills) {
        const mark = skill.findings.some((item) => item.severity === "error") ? "✖" : "✔";
        lines.push(`### ${mark} ${skill.name}`);
        lines.push("");
        lines.push(`\`${skill.path}\``);
        lines.push("");
        if (skill.findings.length === 0) {
            lines.push("No findings.");
            lines.push("");
            continue;
        }
        lines.push(`| Severity | Rule | Location | Message |`);
        lines.push(`| --- | --- | --- | --- |`);
        for (const finding of skill.findings) {
            const where = finding.file
                ? `${finding.file}${finding.line ? `:${finding.line}` : ""}`
                : "-";
            lines.push(`| ${finding.severity} | \`${finding.rule}\` | \`${where}\` | ${escapeMd(finding.message)} |`);
        }
        lines.push("");
    }
    return `${lines.join("\n")}\n`;
}
function escapeMd(value) {
    return value.replace(/\|/g, "\\|").replace(/\n/g, " ");
}
export function countBySeverity(findings) {
    return {
        errors: findings.filter((item) => item.severity === "error").length,
        warnings: findings.filter((item) => item.severity === "warning").length,
        info: findings.filter((item) => item.severity === "info").length,
    };
}
//# sourceMappingURL=report.js.map