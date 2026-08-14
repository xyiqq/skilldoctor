import { type SkillDocument, type SkillFile } from "./types.js";
export declare const PROJECT_SKILL_ROOTS: string[];
export declare const HOME_SKILL_ROOTS: string[];
export declare function discoverSkills(inputPath: string, maxDepth?: number, ignore?: string[]): SkillDocument[];
export declare function findSkillMdFiles(target: string, maxDepth?: number): string[];
export declare function listSkillFiles(root: string): SkillFile[];
export declare function discoverInstalledSkills(cwd?: string): Array<{
    agentRoot: string;
    skill: SkillDocument;
}>;
export declare function skillDisplayName(skill: SkillDocument): string;
export declare function isIgnored(scanRoot: string, skillMdPath: string, patterns: string[]): boolean;
//# sourceMappingURL=discover.d.ts.map