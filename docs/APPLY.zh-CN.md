# Codex for OSS 申请填写稿

打开这个页面，按下面复制即可：

https://openai.com/zh-Hans-CN/form/codex-for-oss/

你只需要自己填 4 个个人信息，其余全部用下面的稿子。

## 你自己填

1. **First name / Last name**：你的姓和名（护照或身份证那种，不要填网名）。
2. **Email**：必须是你登录 ChatGPT 的那个邮箱。
3. **OpenAI Organization ID**：打开 https://platform.openai.com/settings/organization/general 复制 Organization ID，一般是 `org-` 开头。
4. 如果还没有 Organization：先打开 https://platform.openai.com 用同一个 ChatGPT 账号登录，它会自动建一个。

## 直接复制

**GitHub username**

```text
xyiqq
```

**GitHub repository URL**

```text
https://github.com/xyiqq/skilldoctor
```

**Describe your role**

选 **Primary maintainer**。

**Why does this repository qualify?**（434 字符，上限 500）

```text
I am the primary maintainer of skilldoctor (https://github.com/xyiqq/skilldoctor). It is a public MIT CLI and GitHub Action that lints Agent Skills (agentskills.io), audits prompt injection, secrets, and unconstrained tools, and checks Claude/Cursor/Codex/OpenCode compatibility. Vercel skills installs packs; this is the missing CI/author gate for the Codex skill ecosystem. I own reviews, releases, issue triage, and security rules.
```

**I’m interested in...**

两个都勾：

- Codex Security
- API credits for my project

**How will you use API credits for your project?**（303 字符，上限 500）

```text
API credits will fund maintainer automation only: expand audit/compat rules from real-world skills, generate fixtures, draft PR reviews and release notes, triage issues, and run Codex on community PRs. Every model output is human-reviewed before merge. Credits will not be used for a commercial product.
```

**Anything else we should know?**（312 字符）

```text
Public repo, MIT, CI green, first release v0.1.0. Install: npx --yes github:xyiqq/skilldoctor. Next step is a Codex-powered PR review workflow on this repo. I want this to be a reference gate for safe Agent Skills in the Codex ecosystem.
```

## 提交前核对

- GitHub 主页 https://github.com/xyiqq 是公开的
- 仓库 https://github.com/xyiqq/skilldoctor 是公开的
- 你是这个仓库的 owner（已经是）
