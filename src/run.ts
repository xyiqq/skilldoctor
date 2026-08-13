import { listSkillFiles, skillDisplayName } from "./discover.js";
import { auditRules } from "./rules/audit.js";
import { AGENTS, compatRules, supportedAgents } from "./rules/compat.js";
import { lintRules } from "./rules/lint.js";
import type { Finding, Rule, SkillDocument, SkillReport } from "./types.js";

export function applyRules(skill: SkillDocument, rules: Rule[]): Finding[] {
  const files = listSkillFiles(skill.root);
  const findings: Finding[] = [];
  for (const rule of rules) {
    const result = rule.check({ skill, files }) ?? [];
    findings.push(...result);
  }
  return findings;
}

export function lintSkill(skill: SkillDocument): SkillReport {
  return {
    name: skillDisplayName(skill),
    path: skill.root,
    findings: applyRules(skill, lintRules),
  };
}

export function auditSkill(skill: SkillDocument): SkillReport {
  return {
    name: skillDisplayName(skill),
    path: skill.root,
    findings: applyRules(skill, auditRules),
  };
}

export function compatSkill(skill: SkillDocument): SkillReport {
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

export function allChecks(skill: SkillDocument): SkillReport {
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
