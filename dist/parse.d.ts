import type { SkillDocument } from "./types.js";
export declare function loadSkill(skillMdPath: string): SkillDocument;
export declare function parseSkillMd(raw: string, skillMdPath: string): SkillDocument;
export declare function lineNumberAt(source: string, index: number): number;
export declare function findLine(source: string, pattern: RegExp): number | undefined;
export declare function asString(value: unknown): string | undefined;
//# sourceMappingURL=parse.d.ts.map