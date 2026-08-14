import { isAbsolute, join } from "node:path";
import type { Finding, Report } from "./types.js";

export function emitGitHubAnnotations(report: Report): void {
  if (process.env.GITHUB_ACTIONS !== "true") return;

  for (const skill of report.skills) {
    for (const finding of skill.findings) {
      if (finding.severity === "info") continue;
      const level = finding.severity === "error" ? "error" : "warning";
      const file = resolveFindingPath(skill.path, finding.file);
      const line = finding.line ?? 1;
      const message = escapeProperty(`${finding.rule}: ${finding.message}`);
      process.stdout.write(`::${level} file=${escapeProperty(file)},line=${line}::${message}\n`);
    }
  }
}

export function resolveFindingPath(skillPath: string, file?: string): string {
  if (!file) return skillPath;
  if (isAbsolute(file) || file.includes(":") || file.startsWith("/")) return file;
  return join(skillPath, file);
}

function escapeProperty(value: string): string {
  return value.replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A").replace(/:/g, "%3A").replace(/,/g, "%2C");
}

export function worstSeverity(findings: Finding[]): "error" | "warning" | "info" | "ok" {
  if (findings.some((item) => item.severity === "error")) return "error";
  if (findings.some((item) => item.severity === "warning")) return "warning";
  if (findings.length > 0) return "info";
  return "ok";
}
