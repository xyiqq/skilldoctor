import type { Finding, Rule, SkillDocument, SkillReport } from "./types.js";
export declare function applyRules(skill: SkillDocument, rules: Rule[]): Finding[];
export declare function lintSkill(skill: SkillDocument): SkillReport;
export declare function auditSkill(skill: SkillDocument): SkillReport;
export declare function compatSkill(skill: SkillDocument): SkillReport;
export declare function allChecks(skill: SkillDocument): SkillReport;
//# sourceMappingURL=run.d.ts.map