import type { FailOn, Format } from "./types.js";
export interface FileConfig {
    ignore: string[];
    suppress: string[];
    failOn?: FailOn;
    format?: Format;
}
export declare function loadFileConfig(startPath: string): FileConfig;
export declare function mergeIgnore(fileIgnore: string[], cliIgnore: string[]): string[];
export declare function mergeSuppress(fileSuppress: string[], cliSuppress: string[]): string[];
export declare function isSuppressed(ruleId: string, patterns: string[]): boolean;
//# sourceMappingURL=config.d.ts.map