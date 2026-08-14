# Changelog

## 0.2.2

- Add `skilldoctor score` with 0-100 grades and optional `--fail-on score:<n>`. / 新增 `score` 评分命令。
- Add `--format markdown` for PR-friendly reports. / 新增 markdown 报告格式，方便贴到 PR。
- Add `fix --dry-run` to preview safe auto-fixes. / `fix` 支持 `--dry-run`。
- Add `audit/insecure-http` for plain HTTP downloads. / 新增明文 HTTP 下载审计规则。

## 0.2.1

- Fix `.skilldoctor.json` wiping `.skilldoctorignore` when `ignore` is omitted. / 修复 JSON 未写 `ignore` 时清空 ignore 文件的问题。
- Fix GitHub annotations so `SKILL.md` findings resolve under the skill directory. / 修复 GitHub annotation 路径，相对文件会拼到 Skill 目录下。
- Refuse `init` when `SKILL.md` already exists. / `init` 遇到已有 Skill 时拒绝覆盖。
- Improve `--ignore` matching for directory basenames. / `--ignore` 支持按 Skill 目录名匹配。
- Make `lint/duplicate-name` findings idempotent. / 重名告警不再重复叠加。
- Load `.skilldoctor.json` for `scan` format/failOn. / `scan` 也会读取配置文件。

## 0.2.0

- Add `skilldoctor explain <rule>` and `skilldoctor fix`. / 新增规则说明和安全自动修复。
- Read `.skilldoctor.json` and `.skilldoctorignore` from the scan root. / 支持配置文件和 ignore 文件。
- Warn when two skills in the same scan share a name. / 同一次扫描里重名 Skill 会告警。
- Expand the compat matrix with Gemini CLI and GitHub Copilot. / 兼容矩阵增加 Gemini 和 Copilot。
- GitHub Action accepts `ignore`, `format`, and `output`. / Action 支持 ignore、format、output。

## 0.1.2

- Add `--format sarif` for GitHub code scanning. / 新增 `--format sarif`，方便接入 GitHub code scanning。
- Add repeatable `--ignore <pattern>` to skip skill paths. / 新增可重复的 `--ignore`，跳过指定 Skill 路径。
- Warn when `scan` finds a Windows symlink install. / `scan` 发现 Windows 符号链接安装时给出警告。

## 0.1.1

- Add `skilldoctor rules` to print stable rule IDs. / 新增 `skilldoctor rules`，列出稳定规则 ID。
- Skip `test/fixtures` when scanning a repository root, so author CI does not fail on intentional bad examples. / 扫描仓库根目录时跳过 `test/fixtures`，避免作者 CI 被故意写坏的样例绊倒。
- Discover GitHub Copilot skill paths: `.github/skills` and `~/.copilot/skills`. / 增加 Copilot Skill 路径发现。

## 0.1.0

- First public release: `lint`, `audit`, `compat`, `ci`, `scan`, and `init`.
