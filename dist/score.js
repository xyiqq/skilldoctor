import { allChecks } from "./run.js";
import { isSuppressed } from "./config.js";
import { discoverSkills, skillDisplayName } from "./discover.js";
export function scoreSkill(skill, suppress = []) {
    const report = allChecks(skill);
    const findings = suppress.length
        ? report.findings.filter((finding) => !isSuppressed(finding.rule, suppress))
        : report.findings;
    let score = 100;
    for (const finding of findings) {
        if (finding.severity === "error")
            score -= 18;
        else if (finding.severity === "warning")
            score -= 6;
        else
            score -= 1;
    }
    score = Math.max(0, Math.min(100, score));
    const errors = findings.filter((item) => item.severity === "error").length;
    const warnings = findings.filter((item) => item.severity === "warning").length;
    const info = findings.filter((item) => item.severity === "info").length;
    return {
        name: skillDisplayName(skill),
        path: skill.root,
        score,
        grade: gradeFor(score),
        errors,
        warnings,
        info,
        findings,
    };
}
export function runScore(path, ignore = [], suppress = []) {
    const skills = discoverSkills(path, 8, ignore).map((skill) => scoreSkill(skill, suppress));
    if (skills.length === 0) {
        return { skills: [], average: 0, grade: "F" };
    }
    const average = Math.round(skills.reduce((sum, item) => sum + item.score, 0) / skills.length);
    return { skills, average, grade: gradeFor(average) };
}
export function formatScoreReport(report) {
    if (report.skills.length === 0) {
        return "No SKILL.md files found.\n";
    }
    const lines = [
        `skilldoctor score  ${report.skills.length} skill(s)  average ${report.average}/100 (${report.grade})`,
        "",
    ];
    for (const skill of report.skills) {
        lines.push(`${skill.grade}  ${String(skill.score).padStart(3)}  ${skill.name}  ${skill.path}`);
        lines.push(`    errors=${skill.errors}  warnings=${skill.warnings}  info=${skill.info}`);
    }
    lines.push("");
    return `${lines.join("\n")}\n`;
}
function gradeFor(score) {
    if (score >= 90)
        return "A";
    if (score >= 80)
        return "B";
    if (score >= 70)
        return "C";
    if (score >= 60)
        return "D";
    return "F";
}
//# sourceMappingURL=score.js.map