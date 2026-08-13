import type { AgentId, Rule } from "../types.js";
export declare const AGENTS: AgentId[];
export declare const CORE_FIELDS: Set<string>;
export declare const AGENT_FIELDS: Record<AgentId, Set<string>>;
export declare const AGENT_LABEL: Record<AgentId, string>;
export declare function supportedAgents(frontmatter: Record<string, unknown>): Record<AgentId, "yes" | "warn" | "no">;
export declare const compatRules: Rule[];
//# sourceMappingURL=compat.d.ts.map