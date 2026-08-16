# AGENTS.md

## Cursor Cloud specific instructions

`skilldoctor` is a self-contained TypeScript CLI (and GitHub Action) that lints,
audits, and compatibility-checks Agent Skills (`SKILL.md`). There is no backend,
database, browser UI, or other external service — everything runs locally in the
Node.js process.

### Environment
- Requires Node.js >= 18.18 (the VM ships Node 22, which is fine). Uses `npm`
  with `package-lock.json`; do not switch package managers.
- The update script already runs `npm install`, so dependencies are present when
  a session starts. There are no services to launch.

### Standard commands (defined in `package.json` and `.github/workflows/ci.yml`)
- Typecheck: `npm run typecheck`
- Tests (Vitest): `npm test` (watch: `npm run test:watch`)
- Build (emits to `dist/`): `npm run build`
- Full gate (mirrors CI): `npm run ci` (typecheck + test + build)
- Run from source without building: `npm run dev -- <args>` (e.g. `npm run dev -- lint examples`)
- Run the built CLI: `node dist/cli.js <command>` (e.g. `ci`, `lint`, `audit`, `compat`, `score`, `init`, `rules`, `explain`, `fix`)

### Notes
- `dist/` is committed and is the published artifact (the GitHub Action's
  `action.yml` points at `dist/action.js`). After changing anything under
  `src/`, run `npm run build` so `dist/` stays in sync before committing.
- CLI commands exit non-zero when findings meet the `--fail-on` threshold (or
  when zero skills are found for non-`scan` commands); this is expected behavior,
  not an environment failure.
