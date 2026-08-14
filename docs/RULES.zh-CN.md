# 规则目录

规则 ID、命令参数和文件路径保持英文，不要翻译。

## lint

| ID | 级别 | 含义 |
|---|---|---|
| `lint/frontmatter-missing` | error | `SKILL.md` 没有 YAML frontmatter |
| `lint/yaml-invalid` | error | frontmatter 不是合法 YAML |
| `lint/name-missing` | error | 缺少 `name` |
| `lint/name-invalid` | error | `name` 不符合 Agent Skills 字符或长度规则 |
| `lint/name-dir-mismatch` | error | `name` 与父目录名不一致 |
| `lint/description-missing` | error | 缺少 `description` |
| `lint/description-invalid` | error | `description` 类型错误、为空或过长 |
| `lint/description-vague` | warning | 描述太短，或没有说明何时触发 |
| `lint/description-first-person` | warning | 描述应使用第三人称 |
| `lint/compatibility-invalid` | error | `compatibility` 必须是 1-500 字符的字符串 |
| `lint/metadata-invalid` | error | `metadata` 的值必须是字符串 |
| `lint/allowed-tools-invalid` | error | `allowed-tools` 必须是字符串或字符串列表 |
| `lint/body-too-long` | warning | 主 `SKILL.md` 超过 500 行 |
| `lint/broken-reference` | error | `scripts/`、`references/` 或 `assets/` 相对链接不存在 |
| `lint/nested-reference` | warning | 引用超过一层 |
| `lint/windows-path` | warning | Skill 内路径使用了反斜杠 |
| `lint/unknown-portable-field` | info | 字段不在核心规范里 |

## audit

| ID | 级别 | 含义 |
|---|---|---|
| `audit/prompt-injection` | error | 越狱或对用户隐瞒操作的指令 |
| `audit/hardcoded-secret` | error | 私钥或常见密钥形态 |
| `audit/credential-path` | error | 读取 SSH 密钥、云凭证、Cookie 或 `.env` |
| `audit/unconstrained-tools` | error | `Bash(*)` 或通配工具授权 |
| `audit/pipe-to-shell` | error | `curl` / `wget` 直接管道进 shell |
| `audit/exfil-network` | error | 已知的投递或 webhook 主机 |
| `audit/path-escape` | error | 敏感系统路径 |
| `audit/self-modify` | warning | Skill 要求代理改写自身 |
| `audit/obfuscated-code` | warning | `scripts/` 里动态解码或 `eval` |
| `audit/dangerous-script` | error | 递归删除或下载后执行 |

## compat

| ID | 级别 | 含义 |
|---|---|---|
| `compat/claude-only-field` | warning | frontmatter 字段不可移植 |
| `compat/unknown-field` | info | 四个跟踪中的 Agent 都不认识该字段 |
| `compat/context-fork` | warning | `context: fork` 仅 Claude 支持 |
| `compat/allowed-tools-support` | info | `allowed-tools` 仍是实验字段 |

## scan

| ID | 级别 | 含义 |
|---|---|---|
| `scan/duplicate-name` | warning | 同一个 Skill 名安装在多个 Agent 目录 |
| `scan/windows-symlink` | warning | Windows 上通过符号链接安装 Skill |
