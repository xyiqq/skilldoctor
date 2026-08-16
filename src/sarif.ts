import { RULE_CATALOG } from "./catalog.js";
import { packageVersion } from "./package.js";
import type { Report } from "./types.js";

export function formatSarif(report: Report, version = packageVersion()): string {
  const results = report.skills.flatMap((skill) =>
    skill.findings
      .filter((finding) => finding.severity !== "info")
      .map((finding) => ({
        ruleId: finding.rule,
        level: finding.severity === "error" ? "error" : "warning",
        message: { text: finding.message },
        locations: [
          {
            physicalLocation: {
              artifactLocation: {
                uri: toUri(skill.path, finding.file),
              },
              region: {
                startLine: finding.line ?? 1,
              },
            },
          },
        ],
      })),
  );

  const used = new Set(results.map((item) => item.ruleId));
  const rules = RULE_CATALOG.filter((rule) => used.has(rule.id)).map((rule) => ({
    id: rule.id,
    shortDescription: { text: rule.summary },
    defaultConfiguration: {
      level: rule.severity === "error" ? "error" : "warning",
    },
  }));

  return `${JSON.stringify(
    {
      $schema: "https://json.schemastore.org/sarif-2.1.0.json",
      version: "2.1.0",
      runs: [
        {
          tool: {
            driver: {
              name: "skilldoctor",
              version,
              informationUri: "https://github.com/xyiqq/skilldoctor",
              rules,
            },
          },
          results,
        },
      ],
    },
    null,
    2,
  )}\n`;
}

function toUri(skillPath: string, file?: string): string {
  if (!file) return skillPath.replaceAll("\\", "/");
  if (file.includes("/") || file.includes("\\")) return file.replaceAll("\\", "/");
  return `${skillPath.replaceAll("\\", "/")}/${file}`;
}
