# Payload UUID Cutover

This project will move Payload root document IDs from numeric serial IDs to UUID v7 IDs. Production content should be preserved, but study sessions, Payload version history, user sessions, preferences, and lock rows do not need to be preserved.

The cutover uses export/import into a fresh UUID schema. Do not run a primary-key conversion migration against the live production database.

## Temporary Tooling

The repository contains temporary operational scripts for this cutover. They are intentionally not exposed as package scripts because they should only be run deliberately during rehearsal and cutover. Remove them after the UUID production cutover is complete and stable.

```bash
cross-env NODE_OPTIONS=--no-deprecation bun --bun scripts/payload-export.ts tmp/payload-export.json
cross-env NODE_OPTIONS=--no-deprecation bun --bun scripts/payload-import.ts tmp/payload-export.json
cross-env NODE_OPTIONS=--no-deprecation bun --bun scripts/payload-verify-import.ts tmp/payload-export.json
bun run smoke:payload
```

`scripts/payload-export.ts` runs against the current numeric-ID source database and writes a JSON artifact.

`scripts/payload-import.ts` runs against a fresh target database and writes an import map next to the export artifact. For `tmp/payload-export.json`, the map is `tmp/payload-export.import-map.json`.

`scripts/payload-verify-import.ts` uses the export artifact and import map to verify counts, key fields, auth fields, media metadata, and mapped relationships.

`smoke:payload` creates a fresh representative graph in the target database to prove new records and relationships work after import.

## Preserved Data

The export/import tooling preserves:

- users, including `hash` and `salt` so existing admin logins continue to work
- media metadata, so existing Vercel Blob objects remain referenced
- topics
- subtopics
- syllabuses
- syllabus coverage mappings
- current question documents, including parts, choices, accepted answers, worked solutions, and subtopic relationships

The tooling intentionally does not preserve:

- study sessions
- question version history
- user sessions
- Payload preferences
- Payload locked documents

## Tooling PR Sequence

These tooling changes are safe to merge before the UUID cutover because they do not change the runtime schema or Payload adapter ID strategy.

1. Merge the tooling scripts and docs while the app still uses numeric IDs.
2. Create a Neon branch from production for export rehearsal.
3. Point local `DATABASE_URL` to the production clone.
4. Run:

```bash
cross-env NODE_OPTIONS=--no-deprecation bun --bun scripts/payload-export.ts tmp/rehearsal-export.json
```

5. Keep the export artifact local. Do not commit it.

## UUID Rehearsal Sequence

Use this after the UUID code branch exists.

1. Create a fresh disposable Neon target branch for UUID rehearsal.
2. Point local `DATABASE_URL` to the fresh UUID target branch.
3. Run the UUID schema migration:

```bash
bun run migrate
```

4. Import the rehearsal export:

```bash
cross-env NODE_OPTIONS=--no-deprecation bun --bun scripts/payload-import.ts tmp/rehearsal-export.json
```

5. Verify imported content:

```bash
cross-env NODE_OPTIONS=--no-deprecation bun --bun scripts/payload-verify-import.ts tmp/rehearsal-export.json
```

6. Run the live database smoke test:

```bash
bun run smoke:payload
```

7. Manually verify admin login and media rendering against local app or a Vercel preview pointed at the UUID target branch.

## Production Cutover Sequence

Schedule a short write freeze before the final export. Do not allow admin edits during the cutover window.

1. Create an immutable Neon backup branch from current production, for example `production-before-uuid-YYYY-MM-DD`.
2. Create a fresh UUID production target branch, for example `production-uuid`.
3. Using old numeric-ID code, point `DATABASE_URL` at current production and run:

```bash
cross-env NODE_OPTIONS=--no-deprecation bun --bun scripts/payload-export.ts tmp/final-production-export.json
```

4. Switch to the UUID code branch.
5. Point local `DATABASE_URL` at the fresh UUID production target branch.
6. Run:

```bash
bun run migrate
cross-env NODE_OPTIONS=--no-deprecation bun --bun scripts/payload-import.ts tmp/final-production-export.json
cross-env NODE_OPTIONS=--no-deprecation bun --bun scripts/payload-verify-import.ts tmp/final-production-export.json
bun run smoke:payload
```

7. Update Vercel production `DATABASE_URL` to the UUID production target branch. Keep Blob environment variables unchanged.
8. Merge/deploy the UUID code to main only after the UUID production target branch is migrated, imported, and verified.
9. Confirm Vercel runs `bun run ci:build`.
10. After deploy, verify admin login, media, taxonomy, syllabus coverage, question rendering, and new study-session creation.
11. End the write freeze after checks pass.

## Rollback

If production verification fails, repoint Vercel production `DATABASE_URL` back to the old production branch or backup branch and redeploy the previous main commit. Keep the failed UUID branch for investigation.

Because the old production database is never mutated in place, rollback is a connection-string and deployment rollback rather than data repair.

## Future Collection Rule

When adding a new Payload collection, update both pieces of database validation tooling:

- Add or extend a smoke fixture under `scripts/payload-smoke/fixtures`.
- Add export/import/verify coverage under `scripts/payload-transfer` and the top-level transfer scripts if the collection contains production content worth preserving.

The transfer scripts are temporary for this UUID cutover. If they have already been removed, recreate equivalent one-off transfer coverage for any future destructive schema cutover.
