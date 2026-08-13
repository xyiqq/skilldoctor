import type { CliOptions, Finding, Report, SkillReport } from "./types.js";
export declare function emptyReport(command: string): Report;
export declare function finalizeReport(command: string, skills: SkillReport[]): Report;
export declare function shouldFail(report: Report, failOn: CliOptions["failOn"]): boolean;
export declare function formatReport(report: Report, options: CliOptions): string;
export declare function countBySeverity(findings: Finding[]): {
    errors: number;
    warnings: number;
    info: number;
};
//# sourceMappingURL=report.d.ts.map