import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { RULE_CATALOG } from "../src/catalog.js";
import { discoverSkills } from "../src/discover.js";
import { runCi } from "../src/commands.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

describe("v0.1.1 discovery", () => {
  it("does not pick up test fixtures when scanning the repo root", () => {
    const skills = discoverSkills(root);
    expect(skills.some((skill) => skill.root.includes("test") && skill.root.includes("fixtures"))).toBe(false);
    expect(skills.some((skill) => skill.dirName === "release-notes")).toBe(true);
  });

  it("still lints a fixture when that directory is the target", () => {
    const report = runCi(join(root, "test/fixtures/invalid-name"));
    expect(report.summary.errors).toBeGreaterThan(0);
  });

  it("exposes a complete rule catalog", () => {
    expect(RULE_CATALOG.some((rule) => rule.id === "lint/name-invalid")).toBe(true);
    expect(RULE_CATALOG.some((rule) => rule.id === "audit/prompt-injection")).toBe(true);
    expect(RULE_CATALOG.length).toBeGreaterThan(20);
  });
});
