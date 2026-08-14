# Changelog

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
