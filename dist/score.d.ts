import type { Finding, SkillDocument } from "./types.js";
export interface SkillScore {
    name: string;
    path: string;
    score: number;
    grade: "A" | "B" | "C" | "D" | "F";
    errors: number;
    warnings: number;
    info: number;
    findings: Finding[];
}
export interface ScoreReport {
    skills: SkillScore[];
    average: number;
    grade: "A" | "B" | "C" | "D" | "F";
}
export declare function scoreSkill(skill: SkillDocument, suppress?: string[]): SkillScore;
export declare function runScore(path: string, ignore?: string[], suppress?: string[]): ScoreReport;
export declare function formatScoreReport(report: ScoreReport): string;
//# sourceMappingURL=score.d.ts.map