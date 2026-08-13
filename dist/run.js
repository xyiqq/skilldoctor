import { listSkillFiles, skillDisplayName } from "./discover.js";
import { auditRules } from "./rules/audit.js";
import { AGENTS, compatRules, supportedAgents } from "./rules/compat.js";
import { lintRules } from "./rules/lint.js";
export function applyRules(skill, rules) {
    const files = listSkillFiles(skill.root);
    const findings = [];
    for (const rule of rules) {
        const result = rule.check({ skill, files }) ?? [];
        findings.push(...result);
    }
    return findings;
}
export function lintSkill(skill) {
    return {
        name: skillDisplayName(skill),
        path: skill.root,
        findings: applyRules(skill, lintRules),
    };
}
export function auditSkill(skill) {
    return {
        name: skillDisplayName(skill),
        path: skill.root,
        findings: applyRules(skill, auditRules),
    };
}
export function compatSkill(skill) {
    const findings = applyRules(skill, compatRules);
    const matrix = supportedAgents(skill.frontmatter);
    return {
        name: skillDisplayName(skill),
        path: skill.root,
        findings,
        extra: {
            matrix,
            agents: AGENTS,
        },
    };
}
export function allChecks(skill) {
    const findings = [
        ...applyRules(skill, lintRules),
        ...applyRules(skill, auditRules),
        ...applyRules(skill, compatRules),
    ];
    return {
        name: skillDisplayName(skill),
        path: skill.root,
        findings,
        extra: { matrix: supportedAgents(skill.frontmatter) },
    };
}
//# sourceMappingURL=run.js.map