# Study Session Implementation Plan

This plan implements GitHub issue #14: persisted StudySessions with locked question versions, persisted answers, and a StudySession-backed question route.

## Key Decisions

- Add a new Payload collection: `studySession`.
- Persist top-level session `state`: `notStarted`, `started`, or `finished`.
- New sessions currently default to `started` and receive `begunAt` on create.
- Keep `notStarted` modeled for future generation/start flows, but do not create it by default now.
- Mark a session `finished` only when every question is answered; set `endedAt` then.
- Do not store a random seed. Use derived `shuffleKeyBase` instead.
- Existing sessions render the locked `questionVersionId` forever.
- StudySession route never uses draft mode.
- `/question/[id]` remains the live-preview route, but shares StudySession-like UI.
- Remove the Save button globally.
- Preview Flag is local-only; StudySession Flag is persisted with SWR optimistic updates.
- Submit and Skip use server actions. Continue is navigation/no-op on the last question.
- Timer is a tiny client island ticking every second.

## Completed Stages

### Stage 1: Repo Conventions

Status: Completed

- Added project-source Zod guidance to `AGENTS.md`.
- Prefer object spread over `.extend()` for Zod object composition.
- Prefer Zod 4 top-level format validators like `z.email()`, `z.uuid()`, and `z.iso.datetime()`.
- Keep domain schemas separate from Payload collection config, even if literals are duplicated.
- Fixed stale `question-service` unit test expectations so verification reflects the current service contract.

Verification completed:

- `bun run lint` passed with existing warnings.
- `bun run typecheck` passed.
- `bun run test:unit` passed.
- `bun run build` passed with existing warnings.

### Stage 2: Payload Schema

Status: Completed

- Added `src/payload/collections/study-session.ts`.
- Added `src/payload/collections/study-session-utils.ts`.
- Registered `StudySession` in `src/payload/payload.config.ts`.
- Added `tests/unit/study-session-utils.test.ts`.
- Regenerated `src/payload/payload-types.ts`.
- Created migration `src/migrations/20260503_084109.ts` and JSON snapshot.
- Updated `src/migrations/index.ts`.

Behavior implemented:

- Authenticated Payload API access for StudySession collection operations.
- Top-level `state`, `begunAt`, `endedAt`, optional `user`, and question rows.
- Question rows store `question`, locked `questionVersionId`, `status`, `flagged`, timestamps, and explicit answer rows.
- Create hook forces new sessions to `started`, sets `begunAt`, locks latest published question versions, and precreates `unanswered` answers.
- Duplicate questions are rejected.
- Unanswered rows relock/reset when their question changes.
- Answered rows reject question/version changes.
- Finished sessions reject question structure/version changes.
- Latest published version lookup uses Payload `findVersions` with `draft: true`, `version._status = published`, `parent`, and `sort: -updatedAt`.

Generation and migration completed:

- `bun run generate:types` passed.
- `bun run migrate:create` passed.
- `bun run migrate` passed.

Verification completed:

- `bun run lint` passed with existing warnings.
- `bun run typecheck` passed after build settled.
- `bun run test:unit` passed.
- `bun run build` passed with existing warnings.

Note: running `bun run typecheck` in parallel with `bun run build` can race because `next build` regenerates `.next/types`. Rerunning typecheck after build completes passes.

### Stage 3: Domain And Mapping

Status: Completed

- Add `src/lib/domain/study-session.ts`.
- Add Zod schemas for answer variants, question status variants, and top-level state variants.
- Use `z.iso.datetime()` and spread-based object composition.
- Replace question render `seed` with `shuffleKeyBase`.
- Make `RenderableQuestion.index` zero-based; UI displays `index + 1`.
- Add mappers from Payload StudySession and Payload question versions to domain/render models.
- Map Payload `null` timestamps to `undefined`.
- Unit test state invariants, answer variants, duplicate questions, timestamp rules, and mapper behavior.

Verification target:

- `bun run lint`
- `bun run typecheck`
- `bun run test:unit`
- `bun run build`

## Remaining Stages

### Stage 4: Repository And Service

Status: Completed

- Add `study-session-repository.ts`.
- Add `study-session-service.ts`.
- Implement loading a StudySession question by session ID and zero-based question index.
- Fetch locked question versions with `findVersionByID`.
- Implement submit answers, skip question, and set absolute flagged state.
- Derive correctness/results on render rather than storing them.
- Set `state: finished` and `endedAt` on final answer using the same timestamp as final `answeredAt`.
- Keep `state: started` and clear stale `endedAt` on non-final submit.
- Return `neverthrow` results for expected business errors.
- Treat corrupt locked-version/session data as hard errors.

Behavior implemented:

- Added StudySession domain schemas for state, question rows, answer variants, duplicate questions, and timestamp/status invariants.
- Replaced render-model `seed` with `shuffleKeyBase`; the preview route still carries the existing `seed` query/form field until the later preview-route stage.
- Added Payload mappers for StudySession domain state, locked question-version rendering, and persisted-answer evaluation.
- Added `src/lib/repository/study-session-repository.ts` for StudySession fetch/update and locked question-version fetches via `findVersionByID`.
- Added `src/lib/service/study-session-service.ts` with load, submit, skip, and absolute flag mutations.
- Submit validates every required answer against the locked question version and rejects tampered/mismatched data as hard errors.
- Final submit sets `state: finished` and `endedAt` with the same timestamp as `answeredAt`.
- Non-final submit keeps `state: started` and clears stale `endedAt`.
- Skip sets `skipped`, resets answer rows to `unanswered`, and keeps the session started.
- Out-of-range indexes and already-answered mutations return `neverthrow` business errors.
- Corrupt StudySession or locked-version relationships throw hard errors.

Verification completed:

- `bun run lint`
- `bun run typecheck`
- `bun run test:unit`
- `bun run build`

Notes:

- Verification passed with existing lint warnings in `src/lib/domain/question.ts`, `src/lib/repository/question-repository.ts`, and historical migration files.

### Stage 5: Server Actions

Status: Pending

- Add StudySession actions with `next-safe-action`.
- Submit action validates required answers and redirects back to review.
- Skip action persists `skipped` and redirects to next question or stays on the last question.
- Flag action sets absolute `{ flagged }` and returns typed success/error data.
- Keep submit tamper errors as hard failures.
- Keep Continue as navigation/no-op, not a mutation.

Verification target:

- `bun run lint`
- `bun run typecheck`
- `bun run test:unit`
- `bun run build`

### Stage 6: Shared Question UI Refactor

Status: Pending

- Refactor shared question components so both routes use the same UI.
- Remove Save globally.
- Make answer inputs required globally.
- Use `shuffleKeyBase` for deterministic MCQ ordering.
- Inject route-specific submit, skip, continue, and flag behavior.
- Add tiny timer client island.
- Add flag mode adapters:
- Preview: local-only optimistic state.
- StudySession: persisted SWR optimistic mutation.

Verification target:

- `bun run lint`
- `bun run typecheck`
- `bun run test:unit`
- `bun run build`

### Stage 7: StudySession Route

Status: Pending

- Add `/study-session/[studySessionId]/question/[questionIndex]/page.tsx`.
- Parse numeric params; invalid params and out-of-range index call `notFound()`.
- Render only `started` and `finished` sessions; `notStarted` is a hard unsupported-state error for now.
- Never use draft mode.
- Build `shuffleKeyBase` from `studySessionId`, `questionIndex`, and canonical question ID.
- Freeze timer when finished.
- Lock answers and Skip after answered; keep Flag available.

Verification target:

- `bun run lint`
- `bun run typecheck`
- `bun run test:unit`
- `bun run build`
- `bun run test:e2e` if stable test data exists or is added.

### Stage 8: Preview Route Update

Status: Pending

- Replace `seed` with `previewStudySessionId`.
- Redirect `/question/[id]` to add `previewStudySessionId` when missing.
- Preserve `previewStudySessionId` through submitted review URLs.
- Use synthetic preview session state:
- Before submit: `started`.
- After submit: `finished`.
- Preview question index is internal `0`.
- Preview flag is local-only.
- Preview skip/continue are no-op for visual parity.

Verification target:

- `bun run lint`
- `bun run typecheck`
- `bun run test:unit`
- `bun run build`
- `bun run test:e2e` if stable test data exists or is added.

### Stage 9: SWR And Sonner

Status: Pending

- Add `swr`.
- Add shadcn `sonner` with `bunx shadcn@latest add @shadcn/sonner`.
- Add `Toaster` to frontend layout.
- Implement SWR flag cache for only `{ flagged }`.
- Use optimistic update, rollback on error, and populate canonical server result.
- Coalesce rapid clicks with last-write-wins semantics: one in-flight request and one follow-up if desired state changed.
- Show `toast.error(...)` on flag persistence failure.

Verification target:

- `bun run lint`
- `bun run typecheck`
- `bun run test:unit`
- `bun run build`
- Browser inspection with Playwright MCP for affected UI.

### Stage 10: Final Verification

Status: Pending

- Run `bun run generate:types` if Payload types changed during refinement.
- Run `bun run migrate` if not already verified.
- Run `bun run lint`.
- Run `bun run typecheck`.
- Run `bun run test:unit`.
- Run `bun run build`.
- Run `bun run test:e2e` if stable route/test data exists or is added.
- Use Playwright MCP for interactive inspection of changed frontend flows.
- In the PR/implementation summary, explicitly note that AC 7 changed from stored random seed to derived `shuffleKeyBase`.
