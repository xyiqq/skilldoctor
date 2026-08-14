import type { FailOn, Format } from "./types.js";
export interface FileConfig {
    ignore: string[];
    failOn?: FailOn;
    format?: Format;
}
export declare function loadFileConfig(startPath: string): FileConfig;
export declare function mergeIgnore(fileIgnore: string[], cliIgnore: string[]): string[];
//# sourceMappingURL=config.d.ts.map