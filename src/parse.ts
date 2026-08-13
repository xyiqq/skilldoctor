import { readFileSync } from "node:fs";
import { basename, dirname } from "node:path";
import { parse as parseYaml } from "yaml";
import type { SkillDocument } from "./types.js";

const FRONTMATTER_RE = /^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/;

export function loadSkill(skillMdPath: string): SkillDocument {
  const raw = readFileSync(skillMdPath, "utf8").replace(/^\uFEFF/, "");
  return parseSkillMd(raw, skillMdPath);
}

export function parseSkillMd(raw: string, skillMdPath: string): SkillDocument {
  const root = dirname(skillMdPath);
  const dirName = basename(root);
  const match = raw.match(FRONTMATTER_RE);

  if (!match) {
    return {
      root,
      skillMdPath,
      dirName,
      raw,
      frontmatter: {},
      body: raw,
      hasFrontmatter: false,
    };
  }

  try {
    const parsed = parseYaml(match[1] ?? "") ?? {};
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {
        root,
        skillMdPath,
        dirName,
        raw,
        frontmatter: {},
        body: raw.slice(match[0].length),
        hasFrontmatter: true,
        parseError: "frontmatter must be a YAML mapping",
      };
    }

    return {
      root,
      skillMdPath,
      dirName,
      raw,
      frontmatter: parsed as Record<string, unknown>,
      body: raw.slice(match[0].length),
      hasFrontmatter: true,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      root,
      skillMdPath,
      dirName,
      raw,
      frontmatter: {},
      body: raw.slice(match[0].length),
      hasFrontmatter: true,
      parseError: message,
    };
  }
}

export function lineNumberAt(source: string, index: number): number {
  let line = 1;
  for (let i = 0; i < index && i < source.length; i += 1) {
    if (source[i] === "\n") line += 1;
  }
  return line;
}

export function findLine(source: string, pattern: RegExp): number | undefined {
  const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`;
  const re = new RegExp(pattern.source, flags);
  const match = re.exec(source);
  if (!match) return undefined;
  return lineNumberAt(source, match.index);
}

export function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}
