# Contributing / 贡献指南

English first, then Chinese. Keep command names, rule IDs, flags, and file paths unchanged.

## English

1. Fork and clone the repository.
2. Run `npm install`.
3. Add a rule in `src/rules/` and a fixture in `test/fixtures/`.
4. Cover the rule in `test/`.
5. Run `npm run ci`.
6. Open a pull request that explains why the rule belongs in the default gate.

Rule IDs use `lint/`, `audit/`, `compat/`, or `scan/` prefixes. Do not commit `.env`, tokens, or real credentials. Test secrets must be well-known public examples such as `AKIAIOSFODNN7EXAMPLE`.

## 中文

1. Fork 并克隆仓库。
2. 运行 `npm install`。
3. 在 `src/rules/` 增加规则，在 `test/fixtures/` 增加样例 Skill。
4. 在 `test/` 里补测试。
5. 运行 `npm run ci`。
6. 提交 PR 时说明这条规则为什么应该成为默认门禁。

规则 ID 使用 `lint/`、`audit/`、`compat/`、`scan/` 前缀。不要提交 `.env`、令牌或真实密钥。测试密钥只能用公开示例，例如 `AKIAIOSFODNN7EXAMPLE`。
