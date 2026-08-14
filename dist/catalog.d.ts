import type { Severity } from "./types.js";
export interface RuleInfo {
    id: string;
    severity: Severity;
    summary: string;
}
export declare const RULE_CATALOG: RuleInfo[];
export declare function formatRuleCatalog(): string;
//# sourceMappingURL=catalog.d.ts.map