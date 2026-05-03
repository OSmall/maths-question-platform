# AGENTS.md

## Verification

- For meaningful code changes, run `bun run lint`, `bun run build`, and/or `bun run test`.
- If UI or user flows change, run `bun run test:e2e`.

## Frontend Browser Access

- Playwright MCP is available for interactive frontend inspection; before using it against the local app, check whether `http://localhost:3000` is reachable.
- If the app is not running and browser access is needed, start it with `bun run dev` and wait for `localhost:3000` before navigating.

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
  - Payload's automatic DB migration push is turned off in the local environment. When making a change to the schema,
    run `bun run migrate`.

## Project Code Shape

- The app router `page.tsx` files contain thin UI logic translating service-layer logic into Next.js specifics e.g.
  `notFound()`.
- The service layer in `src/app/lib/service` contains just business logic with portability from any frameworks.
  - It is designed that it could be migrated between frameworks and between backends if need-be.
  - `neverthrow` Result is used as the return type to convey data values as well as business logic errors.
- The repository layer sits in-between the service layer and the Payload CMS backend. This exists for mocking purposes
  in tests.
- The domain contains data types that are used for the business logic. Translation between the backend types and the
  domain types is done in mappers in the `data` folder. It is also ok to put them in the repsitory if small.
- In project source, prefer object spread over `.extend()` when composing Zod object schemas.
  Use plain shape objects or `Schema.shape` as appropriate.
- Prefer Zod 4 top-level format validators such as `z.email()`, `z.uuid()`, and `z.iso.datetime()` over deprecated
  string method validators.
- Do not import Payload collection config into domain schemas just to avoid duplicated literals. Keep domain and Payload
  schema layers separate.

## UI Philosophy

- Use shadcn/ui components.
  - Install them via the CLI.
  - They are kept pure by touching them as little as possible, sometimes just adding functionality.
  - Styling of the components are handled at the project level.
- Dark mode and light mode UX should both be considered when designing UI. They should both look good.
- Prefer the use of server components whenever possible
- Make everything React Server Components (RSC) if possible. Reserve client components for tiny client-only behavior,
  e.g. a submit button showing pending state during a server action.
- If a POC depends on state that does not exist yet, do not invent client-side state. Pass temporary state through
  searchParams in a shape that can later be replaced by DB-backed state.
- Keep services/domain canonical. After canonical data is fetched, server UI components may decide display concerns such
  as seeded ordering and SSR review rendering.
- Prefer server actions for sending client data to the server.
  - Always use `next-safe-action` to validate incoming data to server actions and business logic like auth.
- All inputs to components should be pure data. No business logic, or inference should occur within a component. e.g. If
  a component needs to access the search params from a page, the component should handle the parsing of those params,
  the page should do that.

## Official Docs

- Bun: https://bun.sh/docs
- Next.js App Router: https://nextjs.org/docs/app
- Payload CMS: https://payloadcms.com/docs
- shadcn/ui: https://ui.shadcn.com/docs
