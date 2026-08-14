import type { SkillDocument } from "./types.js";
export interface FixResult {
    path: string;
    changes: string[];
}
export declare function runFix(inputPath: string, ignore?: string[]): FixResult[];
export declare function fixSkillText(skill: SkillDocument): {
    next: string;
    changes: string[];
};
//# sourceMappingURL=fix.d.ts.map