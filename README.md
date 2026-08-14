# skilldoctor

[![CI](https://github.com/xyiqq/skilldoctor/actions/workflows/ci.yml/badge.svg)](https://github.com/xyiqq/skilldoctor/actions/workflows/ci.yml)

Quality gate for [Agent Skills](https://agentskills.io). Lint the spec, audit unsafe instructions, and check whether a `SKILL.md` actually works on Claude Code, Cursor, Codex, OpenCode, Gemini CLI, and GitHub Copilot.

Agent Skills 的质量门禁：校验官方规范、审计危险指令，并检查同一个 `SKILL.md` 在 Claude Code、Cursor、Codex、OpenCode、Gemini CLI、GitHub Copilot 上能不能移植。

Vercel `npx skills` installs skills. skilldoctor decides whether you should keep them.

Vercel 的 `npx skills` 负责安装。skilldoctor 负责判断该不该留。

## Install / 安装

```bash
npx --yes github:xyiqq/skilldoctor --help
npx --yes github:xyiqq/skilldoctor lint .
npx --yes github:xyiqq/skilldoctor audit .
npx --yes github:xyiqq/skilldoctor compat .
npx --yes github:xyiqq/skilldoctor ci .
```

From a clone / 从源码：

```bash
git clone https://github.com/xyiqq/skilldoctor.git
cd skilldoctor
npm install
npm run build
node dist/cli.js --help
```

Requires Node.js 18.18 or newer.

## Commands / 命令

```bash
npx --yes github:xyiqq/skilldoctor lint ./my-skill
npx --yes github:xyiqq/skilldoctor audit ./my-skill
npx --yes github:xyiqq/skilldoctor compat ./my-skill
npx --yes github:xyiqq/skilldoctor ci ./my-skill
npx --yes github:xyiqq/skilldoctor scan
npx --yes github:xyiqq/skilldoctor init pdf-processing
npx --yes github:xyiqq/skilldoctor rules
npx --yes github:xyiqq/skilldoctor explain lint/name-invalid
npx --yes github:xyiqq/skilldoctor fix ./my-skill
npx --yes github:xyiqq/skilldoctor fix ./my-skill --dry-run
npx --yes github:xyiqq/skilldoctor score ./my-skill
```

`scan` is also available as `skilldoctor doctor`.

`path` can be one skill directory or a repository root. skilldoctor walks the tree and finds every `SKILL.md`.

`path` 可以是单个 Skill 目录，也可以是仓库根目录。skilldoctor 会向下查找全部 `SKILL.md`。

### Options / 参数

| Flag | Values | Default |
|---|---|---|
| `--format` | `human`, `json`, `sarif`, `markdown` | `human` |
| `--fail-on` | `error`, `warning`, `never`, or `score:<n>` for `score` | `error` |
| `--ignore` | glob or path prefix, repeatable | none |
| `--quiet` |  | off |
| `--dry-run` | with `fix` only | off |

```bash
skilldoctor ci . --format json --fail-on warning
skilldoctor ci . --ignore examples --format markdown
skilldoctor score . --fail-on score:80
```

Optional config files in the repo root / 仓库根目录可选配置：

```json
{
  "failOn": "error",
  "ignore": ["vendor/skills"]
}
```

`.skilldoctorignore` uses one path prefix per line. `#` comments are skipped.

`.skilldoctorignore` 每行一个路径前缀，`#` 开头是注释。

## Example / 示例

```text
skilldoctor ci  1 skill(s)

✔ release-notes  examples/release-notes

1 skills  0 errors  0 warnings  0 info
```

A failing audit looks like this / 失败的审计类似：

```text
✖ audit-injection  test/fixtures/audit-injection
  error  audit/prompt-injection  SKILL.md:8  instructions try to override system or hidden-user policy
```

## GitHub Action

```yaml
name: skilldoctor
on:
  pull_request:
  push:
    branches: [main]
jobs:
  skills:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - uses: xyiqq/skilldoctor@v0.1.0
        with:
          path: .
          fail-on: error
```

Or run the CLI from this repository / 或者直接跑本仓库 CLI：

```yaml
      - run: npx --yes github:xyiqq/skilldoctor ci .
```

## What it checks / 检查什么

- **lint** — `name`, `description`, directory match, YAML, metadata types, 500-line budget, broken `references/` / `scripts/` / `assets/` links
- **audit** — prompt injection, hardcoded secrets, credential paths, `Bash(*)`, `curl | sh`, dump hosts, self-modifying skills
- **compat** — which frontmatter fields survive outside Claude Code
- **scan** — skills already installed for local agents, including duplicate names

Rule IDs are stable: [docs/RULES.en.md](docs/RULES.en.md) / [docs/RULES.zh-CN.md](docs/RULES.zh-CN.md)

## Why not another installer? / 为什么不再做安装器？

The installer slot is taken. This tool is the missing CI gate: authors add one command, reviewers see annotations, users run `audit` before a skill touches `~/.codex/skills`.

安装器赛道已经有人占了。这个工具补的是 CI 门禁：作者加一条命令，审查者能在 PR 里看到 annotation，用户在 Skill 进 `~/.codex/skills` 之前先跑 `audit`。

## Development / 开发

```bash
npm install
npm test
npm run build
node dist/cli.js lint examples
```

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT
