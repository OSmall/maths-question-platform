# Payload Smoke Tests

`bun run smoke:payload` is an on-demand smoke test for a real Payload database. It boots Payload through the Local API, creates one representative graph across the Payload collections, and verifies IDs plus key relationships.

This is separate from the default test stack. Unit, integration, and E2E tests remain self-contained. The smoke test is for migration rehearsals and Neon branch validation.

For the full UUID production cutover flow, see [`docs/payload-uuid-cutover.md`](payload-uuid-cutover.md).

## When To Run

Run the smoke test when changing Payload collections, Payload migrations, database adapter settings, relationship fields, upload tables, or ID strategy.

Prefer a disposable Neon branch cloned from `vercel-dev` or `staging`:

```bash
bun run migrate
bun run smoke:payload
```

Delete the temporary Neon branch after validation. That is safer than relying on row cleanup, especially when migrations or upload records are involved.

## What It Covers

The smoke registry currently creates and verifies:

- `users`
- `topic`
- `subTopic`
- `syllabus`
- `syllabusSubTopic`
- `question`, including version rows, parts, choices, accepted answers, worked solutions, and subtopic relationships
- `studySession`, including nested question and answer rows plus service-layer load/skip behavior
- `media`, using a DB-level row to cover the upload collection table without writing a blob

The script verifies `depth: 0` relationship IDs, `depth: 1` relationship resolution, and root Payload ID shape.

## Extending Coverage

Every new Payload collection should update the smoke test. Add either a new fixture or extend an existing fixture if the new collection is part of the same graph.

Fixture files live in `scripts/payload-smoke/fixtures`. Add the fixture to `scripts/payload-smoke/fixtures/index.ts` in dependency order.

Each fixture has this shape:

```ts
type SmokeFixture = {
  name: string
  create: (context: SmokeContext) => Promise<void>
  verify: (context: SmokeContext) => Promise<void>
}
```

Use `context.marker` in unique fields so smoke records are easy to identify. Store created records in `context.records` for later fixtures.

## ID Strategy Changes

The expected root Payload ID type is intentionally hardcoded in `scripts/payload-smoke.ts`:

```ts
const expectedPayloadIdType = 'number'
```

When the app intentionally migrates Payload IDs to UUIDs, change that constant to `'uuid'` in the same migration work. This keeps the ID-shape change explicit in the diff.

## Vercel And Migrations

Vercel builds should run migrations before building. The repo-level Vercel build command is:

```bash
bun run ci:build
```

`ci:build` runs `payload migrate && bun run build`.
