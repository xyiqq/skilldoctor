import { describe, expect, it } from "vitest";
import { parseSkillMd } from "../src/parse.js";

describe("parseSkillMd", () => {
  it("parses YAML frontmatter and body", () => {
    const skill = parseSkillMd(
      "---\nname: demo\ndescription: Demo skill. Use when testing the parser.\n---\n\n# Demo\n",
      "/tmp/demo/SKILL.md",
    );
    expect(skill.hasFrontmatter).toBe(true);
    expect(skill.frontmatter.name).toBe("demo");
    expect(skill.body).toContain("# Demo");
    expect(skill.dirName).toBe("demo");
  });

  it("reports missing frontmatter", () => {
    const skill = parseSkillMd("# No frontmatter\n", "/tmp/demo/SKILL.md");
    expect(skill.hasFrontmatter).toBe(false);
  });

  it("reports invalid YAML", () => {
    const skill = parseSkillMd("---\nname: [broken\n---\n", "/tmp/demo/SKILL.md");
    expect(skill.parseError).toBeTruthy();
  });
});
