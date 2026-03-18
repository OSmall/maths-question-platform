# AGENTS.md - Coding Agent Guide

This file is the operating manual for agentic coding tools in this repository.
Favor concise, repo-specific guidance. If this file conflicts with generic model habits, follow this file.

## Project Snapshot

- Stack: Next.js 15, Payload CMS 3.65, TypeScript (strict)
- Runtime/package manager: Bun (required)
- Database: Neon Postgres
- Blob storage: Vercel Blob
- Hosting: Vercel preview + production
- Key paths:
  - `src/app/(frontend)` public pages
  - `src/app/(payload)` Payload admin routes
  - `src/payload/collections` Payload collection configs
  - `src/payload/blocks` Payload blocks
  - `src/migrations` DB migrations
  - `src/lib/service` service layer (orchestration + validation)
  - `src/lib/repository` data-access layer
  - `src/lib/data` CMS-to-domain mapping layer
  - `src/lib/domain` CMS-independent domain types
  - `tests/unit` Bun unit tests (mock-first)
  - `tests/int` disabled integration tests pending redesign
  - `tests/e2e` Playwright e2e tests

## Architecture

- Neon uses branch-based environments with the Neon-managed Vercel integration creating a new database branch for each
  preview deployment.
- The default Neon branch is `staging` so preview database branches are created as children of `staging`.
- The `production` database branch is a separate root branch and is not branched from `staging`.

## Bun-First Policy (Mandatory)

This project is Bun-first. Use Bun for runtime, package management, and script execution.

### Required

- Use `bun` for scripts and local execution
- Use `bunx` for package binaries
- If a `bunx`-invoked program is hardcoded to run with Node, add the `--bun` flag.
- Use `bun add` / `bun remove` for dependency management
- Prefer Bun-native TypeScript execution (`bun file.ts`)

### Prohibited

Do not use:

- `node`
- `npm`
- `npx`
- `yarn`
- `pnpm`
- `ts-node`
- `tsx`

### Command Mapping

| Instead of                        | Use                 |
| --------------------------------- | ------------------- |
| `npm install`                     | `bun install`       |
| `npm run dev`                     | `bun run dev`       |
| `npm test`                        | `bun test`          |
| `npx playwright`                  | `bunx playwright`   |
| `bunx <tool>` when Node is forced | `bunx --bun <tool>` |
| `node script.ts`                  | `bun script.ts`     |

### Known Inconsistency (Do Not Auto-Fix)

- `playwright.config.ts` currently uses `webServer.command: 'pnpm dev'`.
- Keep Bun-first guidance in this file; config cleanup can be done separately.

## Build, Lint, and Test Commands

Use these exact commands unless task-specific constraints require otherwise.

### Development

```bash
bun run dev
bun run build
bun run start
```

### Lint

```bash
bun run lint
```

### Full Test Suites

```bash
bun run test
bun test tests/unit
bun run test:e2e
```

### Run a Single Test (Important)

#### Bun test (unit)

```bash
# Single test file
bun test ./tests/unit/question-service.test.ts

# By test name
bun test tests/unit --test-name-pattern "parses the id string"
```

#### Playwright (e2e)

```bash
# Single test file
bunx playwright test tests/e2e/frontend.e2e.spec.ts --config=playwright.config.ts

# By test name / grep
bunx playwright test -g "can go on homepage" --config=playwright.config.ts

# By project
bunx playwright test --project=chromium --config=playwright.config.ts
```

### Payload and Codegen

```bash
bun run payload
bun run generate:types
bun run generate:importmap
bun run payload migrate:create
bun run ci:build
```

## Agent Workflow

When implementing changes:

1. Read nearby code and constraints first.
2. Prefer the smallest safe change.
3. Preserve existing architecture and naming patterns.
4. Add or update tests for behavior changes.
5. Run relevant verification commands.
6. Report what changed, where, and how to validate.

### Data Access Architecture

- For non-trivial features, follow this flow: page/route -> service -> repository. The repository will fetch from the
  backend and map to domain objects using mappers.
- Keep Next.js pages and route handlers thin. Framework layers should parse request params and translate results into
  framework responses (`Response`, `redirect`, `notFound()`), not hold business rules. Decouple the Next.js from the
  business logic.
- Put business logic (validation, authorization decisions, orchestration) in `src/lib/service/*`.
- Use `neverthrow` between the service layer and Next.js boundaries (page/route). Services should return `Result` /
  `ResultAsync`, and Next.js boundaries should map domain errors to framework behavior.
- Keep Payload/CMS types out of UI-facing components; map to domain types before rendering.
- In repositories, shape queries deliberately (`select`, minimal `depth`) and return mapped domain entities.
- At route/page boundaries, translate domain errors into framework behavior (for example `notFound()`).

## Definition of Done (Practical)

Do what is relevant to the change scope:

- Always for meaningful code changes:
  - `bun run lint`
  - `bun run build`
- Service/domain behavior changed:
  - `bun test tests/unit`
- UI/user-flow changed:
  - `bun run test:e2e` (or explain why not feasible in current environment)
- Never manually edit generated files (especially `src/payload/payload-types.ts`).

## Code Style Guidelines

### Formatting

- Prettier is the source of truth (`.prettierrc.json`).
- Current defaults include single quotes, trailing commas, `printWidth: 100`, and no semicolons.
- Do not hand-format against Prettier output.

### TypeScript

- `strict` mode is enabled and should be respected.
- Avoid `any` unless unavoidable; prefer explicit types and narrowing.
- Use path aliases:
  - `@/*` -> `src/*`
  - `@payload-config` -> `src/payload/payload.config.ts`
- Prefix intentionally unused vars/args with `_`.
- Caught errors may use `_error` or `ignore*` prefixes.

### Imports

- Keep import style consistent with surrounding file and formatter output.
- Prefer path aliases over deep relative imports inside `src`.

### Naming Conventions

- Files: kebab-case.
- Components: PascalCase.
- Variables/functions: camelCase.
- Payload objects (Collections, Blocks): PascalCase export, kebab-case slug.

### Error Handling

- Use `try/catch` for async flows that can fail.
- Prefer `neverthrow` (`Result` / `ResultAsync`) in service/repository flows where failure is expected and should be explicit.
- Wrap unknown/third-party errors at boundaries into domain/app errors; do not leak raw `unknown` errors upward.
- Add context when logging errors.
- Re-throw when callers must handle failure.
- Do not silently swallow errors unless explicitly intentional.

### ESLint Notes

The following are currently warnings (not errors):

- `@typescript-eslint/ban-ts-comment`
- `@typescript-eslint/no-empty-object-type`
- `@typescript-eslint/no-explicit-any`
- `@typescript-eslint/no-unused-vars`

## Next.js and UI Rules

### Routing and Links

- Use `next/link` for internal navigation.
- Use `<a target="_blank" rel="noopener noreferrer">` for external links.
- Use `next/image` instead of raw `<img>` when possible.

### Server/Client Boundaries

- Prefer Server Components by default.
- Add `'use client'` only for true client-side interactivity.
- Do not pass functions from Server Components to Client Components.
- Do not import non-component functions from `'use client'` modules into Server Components.

### Base UI / shadcn Usage

- `src/components/ui/*` is generated; avoid editing unless necessary.
- Prefer wrappers in `src/components/*` over modifying generated UI primitives.
- Base UI uses `render` prop (not `asChild`).
- In Server Components, prefer JSX element render pattern:
  - `render={<Link href="/path" />}`
- Use `nativeButton={false}` when rendering non-button elements through Button.

### Theming and Dark Mode (Mandatory for UI work)

- This repo uses shadcn CSS-variable theming (`components.json` has `tailwind.cssVariables: true`).
- Theme tokens are defined in `src/app/globals.css` with light values in `:root` and dark values in `.dark`.
- Prefer semantic token utilities over hardcoded palette colors:
  - Use classes like `bg-background`, `text-foreground`, `bg-card`, `text-card-foreground`, `bg-popover`,
    `text-popover-foreground`, `bg-primary`, `text-primary-foreground`, `bg-secondary`,
    `text-secondary-foreground`, `bg-muted`, `text-muted-foreground`, `border-border`, `bg-input`, `ring-ring`.
- Opacity variants are allowed on tokens (for example `bg-primary/10`, `text-foreground/80`, `ring-ring/50`).
- Do not hardcode core surface/text/border colors in app UI (for example `bg-white`, `text-slate-900`,
  `dark:bg-slate-900`) when a semantic token class can express the same intent.
- Use `dark:` only when behavior/layout truly differs by theme, not for routine color swapping already handled by
  tokens.

## Payload CMS Rules

- Do not edit `src/payload/payload-types.ts` directly.
- After changing collections/blocks/fields, run:
  - `bun run generate:types`
  - `bun run generate:importmap` (if applicable)
- For schema/data model changes, create migration before merging:
  - `bun run payload migrate:create`
- Prefer typed Payload config/collection/block definitions.

## Environment Variables

Expected for development:

- `PAYLOAD_SECRET`
- `DATABASE_URL`
- `BLOB_READ_WRITE_TOKEN`

Bun loads `.env` automatically in project root.

## Skill Usage

Use of these local skills is encouraged when relevant. Read the skill `SKILL.md` first and apply it.

### `payload`

Use for Payload collection design, field modeling, hooks, access control, Local API behavior,
validation/security issues, relationship queries, and transaction/hook debugging.

### `next-best-practices`

Use for Next.js architecture decisions: app router conventions, RSC boundaries, async APIs,
metadata, error boundaries, route handlers, hydration/suspense issues, and bundling concerns.

### `vercel-react-best-practices`

Use for React/Next performance work: eliminating waterfalls, reducing bundle size,
server/client performance patterns, rerender optimization, and targeted refactors.

## Keep This File Healthy

- Prefer actionable rules over long tutorials.
- Keep examples minimal and only where ambiguity is likely.
- Remove stale or duplicate guidance promptly.
- Update commands when scripts/config change.
