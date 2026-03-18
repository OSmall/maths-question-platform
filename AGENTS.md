# AGENTS.md

## Verification

- For meaningful code changes, run `bun run lint`, `bun run build`, and/or `bun run test`.
- If UI or user flows change, run `bun run test:e2e`.

## Repo Context

- This project uses Neon branch-based environments with Vercel previews.
- The default Neon branch is `staging`, so preview database branches are created from `staging`.
- The `production` database branch is a separate root branch, not a child of `staging`.
- There is a `vercel-dev` branch used for local development environments. This is a child of `staging`.

## Generated Files and Schema Work

- Do not manually edit generated files such as `src/payload/payload-types.ts`.
- After changing Payload collections, blocks, or fields, regenerate artifacts with `bun run generate:types` and
  `bun run generate:importmap` when needed.
- For Payload schema or data-model changes, create a migration with `bun run migrate:create`.
  - When pushing a commit that contains these Payload changes, the preview deployment needs this migration created to
  deploy properly.

## Project Code Shape

- The app router `page.tsx` files contain thin UI logic translating service-layer logic into Next.js specifics e.g.
  `notFound()`.
- The service layer in `src/app/lib/service` contains just business logic with portability from any frameworks.
  - It is designed that it could be migrated between frameworks and between backends if need-be.
  - `neverthrow` is used as the return type to convey data values as well as business logic errors.
- The repository layer sits in-between the service layer and the Payload CMS backend. This exists for mocking purposes
  in tests.
- The domain contains data types that are used for the business logic. Translation between the backend types and the
  domain types is done in mappers in the `data` folder.

## UI Philosophy

- Use shadcn/ui components.
  - Install them via the CLI.
  - They are kept pure by touching them as little as possible, sometimes just adding functionality.
  - Styling of the components are handled at the project level.
- Dark mode and light mode UX should both be considered when designing UI. They should both look good.
- Prefer the use of server components whenever possible

## Official Docs

- Bun: https://bun.sh/docs
- Next.js App Router: https://nextjs.org/docs/app
- Payload CMS: https://payloadcms.com/docs
- shadcn/ui: https://ui.shadcn.com/docs
