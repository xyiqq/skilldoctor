import { existsSync } from "node:fs";
import { join } from "node:path";
import { asString, findLine } from "../parse.js";
import {
  MAX_COMPATIBILITY_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  MAX_NAME_LENGTH,
  RECOMMENDED_BODY_LINES,
  SPEC_NAME_RE,
  type Finding,
  type Rule,
  type RuleContext,
} from "../types.js";

const SPEC_FIELDS = new Set([
  "name",
  "description",
  "license",
  "compatibility",
  "metadata",
  "allowed-tools",
]);

const VAGUE_DESCRIPTIONS = /^(helps? with|utility|helper|tools?|misc|stuff|various)\b/i;
const FIRST_PERSON = /^(i |i'm |i can |you can |use me\b)/i;
const WHEN_HINT = /\b(use when|when the user|when working|triggers?|asks? for)\b/i;
const RELATIVE_REF_RE =
  /(?:(?:\[[^\]]*\]\((?!https?:|mailto:|#)([^)]+)\))|(?:(?:scripts|references|assets)\/[A-Za-z0-9._/-]+))/g;

export const lintRules: Rule[] = [
  {
    id: "lint/frontmatter-missing",
    check: ({ skill }) => {
      if (skill.hasFrontmatter) return;
      return [
        finding(
          "lint/frontmatter-missing",
          "error",
          "SKILL.md must start with YAML frontmatter delimited by ---",
          skill,
          1,
          "Add a frontmatter block with name and description.",
        ),
      ];
    },
  },
  {
    id: "lint/yaml-invalid",
    check: ({ skill }) => {
      if (!skill.parseError) return;
      return [
        finding(
          "lint/yaml-invalid",
          "error",
          `Invalid YAML frontmatter: ${skill.parseError}`,
          skill,
          1,
        ),
      ];
    },
  },
  {
    id: "lint/name-missing",
    check: ({ skill }) => {
      if (!skill.hasFrontmatter || skill.parseError) return;
      if (skill.frontmatter.name !== undefined) return;
      return [finding("lint/name-missing", "error", "frontmatter.name is required", skill, 2)];
    },
  },
  {
    id: "lint/name-invalid",
    check: ({ skill }) => {
      if (!skill.hasFrontmatter || skill.parseError) return;
      const name = skill.frontmatter.name;
      if (name === undefined) return;
      if (typeof name !== "string") {
        return [
          finding(
            "lint/name-invalid",
            "error",
            "frontmatter.name must be a string",
            skill,
            fieldLine(skill.raw, "name"),
          ),
        ];
      }
      const issues: Finding[] = [];
      if (name.length < 1 || name.length > MAX_NAME_LENGTH) {
        issues.push(
          finding(
            "lint/name-invalid",
            "error",
            `frontmatter.name must be 1-${MAX_NAME_LENGTH} characters`,
            skill,
            fieldLine(skill.raw, "name"),
          ),
        );
      }
      if (!SPEC_NAME_RE.test(name)) {
        issues.push(
          finding(
            "lint/name-invalid",
            "error",
            "frontmatter.name must be lowercase alphanumeric with single hyphens (no leading, trailing, or consecutive hyphens)",
            skill,
            fieldLine(skill.raw, "name"),
            "Example: pdf-processing",
          ),
        );
      }
      return issues;
    },
  },
  {
    id: "lint/name-dir-mismatch",
    check: ({ skill }) => {
      const name = asString(skill.frontmatter.name);
      if (!name || name === skill.dirName) return;
      return [
        finding(
          "lint/name-dir-mismatch",
          "error",
          `frontmatter.name "${name}" must match the parent directory name "${skill.dirName}"`,
          skill,
          fieldLine(skill.raw, "name"),
        ),
      ];
    },
  },
  {
    id: "lint/description-missing",
    check: ({ skill }) => {
      if (!skill.hasFrontmatter || skill.parseError) return;
      if (skill.frontmatter.description !== undefined) return;
      return [
        finding(
          "lint/description-missing",
          "error",
          "frontmatter.description is required",
          skill,
          2,
        ),
      ];
    },
  },
  {
    id: "lint/description-invalid",
    check: ({ skill }) => {
      const value = skill.frontmatter.description;
      if (value === undefined) return;
      if (typeof value !== "string") {
        return [
          finding(
            "lint/description-invalid",
            "error",
            "frontmatter.description must be a string",
            skill,
            fieldLine(skill.raw, "description"),
          ),
        ];
      }
      if (value.trim().length === 0) {
        return [
          finding(
            "lint/description-invalid",
            "error",
            "frontmatter.description must be non-empty",
            skill,
            fieldLine(skill.raw, "description"),
          ),
        ];
      }
      if (value.length > MAX_DESCRIPTION_LENGTH) {
        return [
          finding(
            "lint/description-invalid",
            "error",
            `frontmatter.description must be at most ${MAX_DESCRIPTION_LENGTH} characters`,
            skill,
            fieldLine(skill.raw, "description"),
          ),
        ];
      }
      return;
    },
  },
  {
    id: "lint/description-vague",
    check: ({ skill }) => {
      const description = asString(skill.frontmatter.description);
      if (!description) return;
      const issues: Finding[] = [];
      if (description.trim().length < 24 || VAGUE_DESCRIPTIONS.test(description.trim())) {
        issues.push(
          finding(
            "lint/description-vague",
            "warning",
            "description is too vague for reliable skill discovery",
            skill,
            fieldLine(skill.raw, "description"),
            "Say what the skill does and when the agent should use it.",
          ),
        );
      }
      if (!WHEN_HINT.test(description)) {
        issues.push(
          finding(
            "lint/description-vague",
            "warning",
            "description should include when to use the skill",
            skill,
            fieldLine(skill.raw, "description"),
            'Add a trigger clause such as "Use when the user asks to ...".',
          ),
        );
      }
      if (FIRST_PERSON.test(description.trim())) {
        issues.push(
          finding(
            "lint/description-first-person",
            "warning",
            "description should be third person, not first or second person",
            skill,
            fieldLine(skill.raw, "description"),
          ),
        );
      }
      return issues;
    },
  },
  {
    id: "lint/compatibility-invalid",
    check: ({ skill }) => {
      const value = skill.frontmatter.compatibility;
      if (value === undefined) return;
      if (typeof value !== "string") {
        return [
          finding(
            "lint/compatibility-invalid",
            "error",
            "frontmatter.compatibility must be a string",
            skill,
            fieldLine(skill.raw, "compatibility"),
          ),
        ];
      }
      if (value.length < 1 || value.length > MAX_COMPATIBILITY_LENGTH) {
        return [
          finding(
            "lint/compatibility-invalid",
            "error",
            `frontmatter.compatibility must be 1-${MAX_COMPATIBILITY_LENGTH} characters`,
            skill,
            fieldLine(skill.raw, "compatibility"),
          ),
        ];
      }
      return;
    },
  },
  {
    id: "lint/metadata-invalid",
    check: ({ skill }) => {
      const value = skill.frontmatter.metadata;
      if (value === undefined) return;
      if (value === null || typeof value !== "object" || Array.isArray(value)) {
        return [
          finding(
            "lint/metadata-invalid",
            "error",
            "frontmatter.metadata must be a mapping of string keys to string values",
            skill,
            fieldLine(skill.raw, "metadata"),
          ),
        ];
      }
      const issues: Finding[] = [];
      for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
        if (typeof item !== "string") {
          issues.push(
            finding(
              "lint/metadata-invalid",
              "error",
              `metadata.${key} must be a string (quote versions like "1.0")`,
              skill,
              fieldLine(skill.raw, key),
            ),
          );
        }
      }
      return issues;
    },
  },
  {
    id: "lint/allowed-tools-invalid",
    check: ({ skill }) => {
      const value = skill.frontmatter["allowed-tools"];
      if (value === undefined) return;
      if (typeof value === "string" || (Array.isArray(value) && value.every((item) => typeof item === "string"))) {
        return;
      }
      return [
        finding(
          "lint/allowed-tools-invalid",
          "error",
          "frontmatter.allowed-tools must be a string or a list of strings",
          skill,
          fieldLine(skill.raw, "allowed-tools"),
        ),
      ];
    },
  },
  {
    id: "lint/body-too-long",
    check: ({ skill }) => {
      const lines = skill.body.split(/\r?\n/).length;
      if (lines <= RECOMMENDED_BODY_LINES) return;
      return [
        finding(
          "lint/body-too-long",
          "warning",
          `SKILL.md body is ${lines} lines; keep the main file under ${RECOMMENDED_BODY_LINES} lines`,
          skill,
          RECOMMENDED_BODY_LINES,
          "Move reference material into references/ for progressive disclosure.",
        ),
      ];
    },
  },
  {
    id: "lint/broken-reference",
    check: ({ skill }) => {
      const issues: Finding[] = [];
      const seen = new Set<string>();
      for (const match of skill.body.matchAll(RELATIVE_REF_RE)) {
        const rawRef = (match[1] ?? match[0]).trim();
        const cleaned = rawRef.replace(/^\.\//, "").split("#")[0]?.split("?")[0] ?? "";
        if (!cleaned || cleaned.startsWith("/") || seen.has(cleaned)) continue;
        if (!/^(scripts|references|assets)\//.test(cleaned) && !match[1]) continue;
        seen.add(cleaned);
        if (cleaned.includes("\\")) {
          issues.push(
            finding(
              "lint/windows-path",
              "warning",
              `use POSIX relative paths instead of backslashes: ${cleaned}`,
              skill,
              findLine(skill.body, new RegExp(escapeRegExp(cleaned))) ?? undefined,
              undefined,
              "SKILL.md",
              true,
            ),
          );
        }
        const target = join(skill.root, cleaned.replaceAll("/", "\\").replaceAll("\\", "/"));
        const normalized = join(skill.root, ...cleaned.split("/"));
        if (!existsSync(normalized) && !existsSync(target)) {
          issues.push(
            finding(
              "lint/broken-reference",
              "error",
              `referenced file does not exist: ${cleaned}`,
              skill,
              findLine(skill.body, new RegExp(escapeRegExp(cleaned))) ?? undefined,
              undefined,
              "SKILL.md",
              true,
            ),
          );
        }
        const depth = cleaned.split("/").filter(Boolean).length;
        if (depth > 2) {
          issues.push(
            finding(
              "lint/nested-reference",
              "warning",
              `keep file references one level deep from SKILL.md: ${cleaned}`,
              skill,
              findLine(skill.body, new RegExp(escapeRegExp(cleaned))) ?? undefined,
              undefined,
              "SKILL.md",
              true,
            ),
          );
        }
      }
      return issues;
    },
  },
  {
    id: "lint/unknown-portable-field",
    check: ({ skill }) => {
      if (!skill.hasFrontmatter || skill.parseError) return;
      const extras = Object.keys(skill.frontmatter).filter((key) => !SPEC_FIELDS.has(key));
      if (extras.length === 0) return;
      return extras.map((key) =>
        finding(
          "lint/unknown-portable-field",
          "info",
          `frontmatter.${key} is outside the Agent Skills core spec`,
          skill,
          fieldLine(skill.raw, key),
          "Use compat to see which agents honor this field.",
        ),
      );
    },
  },
];

function finding(
  rule: string,
  severity: Finding["severity"],
  message: string,
  skill: RuleContext["skill"],
  line?: number,
  hint?: string,
  file = "SKILL.md",
  bodyRelative = false,
): Finding {
  const offset = bodyRelative ? skill.raw.length - skill.body.length : 0;
  const lineCountBeforeBody = skill.raw.slice(0, offset).split(/\r?\n/).length - 1;
  const resolvedLine = line === undefined ? undefined : bodyRelative ? line + lineCountBeforeBody : line;
  return { rule, severity, message, file, line: resolvedLine, hint };
}

function fieldLine(raw: string, field: string): number | undefined {
  return findLine(raw, new RegExp(`^${escapeRegExp(field)}\\s*:`, "m"));
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
