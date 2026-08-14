import type { Report } from "./types.js";
export declare function runLint(path: string, ignore?: string[]): Report;
export declare function runAudit(path: string, ignore?: string[]): Report;
export declare function runCompat(path: string, ignore?: string[]): Report;
export declare function runCi(path: string, ignore?: string[]): Report;
export declare function runScan(cwd?: string): Report;
export declare function runInit(name: string, cwd?: string): {
    path: string;
};
//# sourceMappingURL=commands.d.ts.map