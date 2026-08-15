export type Severity = "error" | "warning" | "info";
export type Format = "human" | "json" | "sarif" | "markdown";
export type FailOn = "error" | "warning" | "never";
export type AgentId = "claude" | "cursor" | "codex" | "opencode" | "gemini" | "copilot";

export interface Finding {
  rule: string;
  severity: Severity;
  message: string;
  file?: string;
  line?: number;
  hint?: string;
}

export interface SkillDocument {
  root: string;
  skillMdPath: string;
  dirName: string;
  raw: string;
  frontmatter: Record<string, unknown>;
  body: string;
  parseError?: string;
  hasFrontmatter: boolean;
}

export interface SkillFile {
  path: string;
  relativePath: string;
  content: string;
}

export interface SkillReport {
  name: string;
  path: string;
  findings: Finding[];
  extra?: Record<string, unknown>;
}

export interface Report {
  ok: boolean;
  command: string;
  skills: SkillReport[];
  summary: {
    skills: number;
    errors: number;
    warnings: number;
    info: number;
  };
}

export interface CliOptions {
  format: Format;
  failOn: FailOn;
  quiet: boolean;
  ignore: string[];
  suppress: string[];
}

export interface RuleContext {
  skill: SkillDocument;
  files: SkillFile[];
}

export interface Rule {
  id: string;
  check: (ctx: RuleContext) => Finding[] | void;
}

export const SPEC_NAME_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const MAX_NAME_LENGTH = 64;
export const MAX_DESCRIPTION_LENGTH = 1024;
export const MAX_COMPATIBILITY_LENGTH = 500;
export const RECOMMENDED_BODY_LINES = 500;
export const IGNORE_DIR_NAMES = new Set([
  "node_modules",
  ".git",
  "dist",
  "coverage",
  ".next",
  ".turbo",
  ".cache",
  "__pycache__",
  "vendor",
]);
