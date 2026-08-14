import { writeFileSync } from "node:fs";
import { discoverSkills } from "./discover.js";
import type { SkillDocument } from "./types.js";

export interface FixResult {
  path: string;
  changes: string[];
}

export function runFix(inputPath: string, ignore: string[] = [], dryRun = false): FixResult[] {
  const skills = discoverSkills(inputPath, 8, ignore);
  const results: FixResult[] = [];
  for (const skill of skills) {
    const { next, changes } = fixSkillText(skill);
    if (changes.length === 0 || next === skill.raw) continue;
    if (!dryRun) writeFileSync(skill.skillMdPath, next, "utf8");
    results.push({ path: skill.skillMdPath, changes });
  }
  return results;
}

export function fixSkillText(skill: SkillDocument): { next: string; changes: string[] } {
  if (!skill.hasFrontmatter || skill.parseError) {
    return { next: skill.raw, changes: [] };
  }

  const changes: string[] = [];
  let next = skill.raw;

  const quoted = quoteNumericFrontmatterScalars(next);
  if (quoted !== next) {
    changes.push("quoted numeric frontmatter values");
    next = quoted;
  }

  const posix = next.replace(/(scripts|references|assets)\\+/g, "$1/");
  if (posix !== next) {
    changes.push("converted backslash skill paths to POSIX");
    next = posix;
  }

  if (next.length > 0 && !next.endsWith("\n")) {
    next += "\n";
    changes.push("added trailing newline");
  }

  return { next, changes };
}

function quoteNumericFrontmatterScalars(raw: string): string {
  const match = raw.match(/^(---[ \t]*\r?\n)([\s\S]*?)(\r?\n---[ \t]*)/);
  if (!match) return raw;
  const yaml = match[2] ?? "";
  const fixed = yaml.replace(
    /^([ \t]*[A-Za-z0-9_-]+:[ \t]*)(\d+(?:\.\d+)?)([ \t]*)$/gm,
    (_all, prefix: string, value: string, suffix: string) => `${prefix}"${value}"${suffix}`,
  );
  if (fixed === yaml) return raw;
  return raw.replace(match[0], `${match[1]}${fixed}${match[3]}`);
}
