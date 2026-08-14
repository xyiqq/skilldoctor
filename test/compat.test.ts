import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { runCompat } from "../src/commands.js";

const fixtures = join(dirname(fileURLToPath(import.meta.url)), "fixtures");

describe("compat", () => {
  it("marks a core skill portable", () => {
    const report = runCompat(join(fixtures, "valid-minimal"));
    const matrix = report.skills[0]?.extra?.matrix as Record<string, string>;
    expect(matrix.claude).toBe("yes");
    expect(matrix.cursor).toBe("yes");
    expect(matrix.codex).toBe("yes");
    expect(matrix.opencode).toBe("yes");
    expect(matrix.gemini).toBe("yes");
    expect(matrix.copilot).toBe("yes");
  });

  it("warns on Claude-only context fork", () => {
    const report = runCompat(join(fixtures, "compat-claude-only"));
    const rules = report.skills[0]?.findings.map((item) => item.rule) ?? [];
    expect(rules).toContain("compat/context-fork");
    expect(rules).toContain("compat/claude-only-field");
    const matrix = report.skills[0]?.extra?.matrix as Record<string, string>;
    expect(matrix.codex).toBe("warn");
    expect(matrix.opencode).toBe("warn");
    expect(matrix.gemini).toBe("warn");
    expect(matrix.copilot).toBe("warn");
  });
});
