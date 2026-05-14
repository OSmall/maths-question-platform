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
- Preview Flag is URL-backed and uses SWR optimistic updates with Next router `replace`; StudySession Flag is persisted with SWR optimistic updates.
- Submit and Skip use server actions. Continue is navigation/no-op on the last question.
- StudySession question URLs are one-based for users; service/domain question indexes remain zero-based.
- Keep `notStarted` future-modeled but unsupported in the current route; if an owned session is `notStarted`, return a service business error and show a simple route-level message.
- Timer is a tiny client island ticking every second.
- Add Payload-backed frontend authentication before StudySession server actions/routes.
- Use one Payload `users` collection with optional multi-role values: `admin` and `student`.
- Public frontend routes are `/`, `/login`, and `/test-landing-page`; other frontend pages require login by default.
- `/question/**` is admin-only authoring/preview UI.
- `/study-session/**` requires `student` and is always owner-only in the frontend, with no admin frontend bypass.
- `question` and authoring collections are admin-only; StudySession rendering authorizes the owned session first, then uses trusted server access to fetch the locked question version.

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

### Stage 5: Authentication, Roles, And Frontend Ownership

Status: Completed

- Lean on Payload authentication rather than adding a separate auth provider.
- Keep the existing Payload `users` collection as the single auth collection.
- Add optional multi-select `roles` values: `admin` and `student`.
- Allow users to have zero roles, one role, or both roles.
- Save roles to JWT for server-side role checks.
- Backfill existing users to `admin` and `student`.
- Ensure the first-ever user in a fresh environment gets `admin`.
- For later admin-created users, roles are whatever the admin selects in Payload admin; no automatic student role is required.
- Users with zero roles may log in, but cannot access role-specific protected areas.
- Restrict Payload admin access to users with `admin`.
- Make authoring collections admin-only, including `question`, taxonomy, syllabus, syllabus coverage, and media management.
- Keep `/`, `/login`, and `/test-landing-page` public.
- Add a custom frontend `/login` page that uses Payload's `@payloadcms/next/auth` login helper.
- Do not reuse Payload admin login as the frontend/student login UI.
- Add current-session logout using Payload's logout helper.
- Redirect unauthenticated protected-route access to `/login?redirect=...`.
- Accept only safe relative redirect paths.
- On successful login, use the valid redirect first.
- If no redirect exists, send users with `admin` to `/admin`; otherwise send them to `/`.
- Redirect already-authenticated users away from `/login` using the same destination rules.
- Show login when signed out and logout when signed in.
- Show the admin link only for users with `admin`.
- Add shared auth helpers for reading the current Payload user from `headers()` and checking roles.
- Add Payload access helpers for admin-only, authenticated, and owned-resource rules.
- Make `StudySession.user` required.
- Create a migration that fails if any existing StudySession has no owner.
- Enforce frontend StudySession access as `studySession.user === currentUser.id`, including for admins.
- Keep admin access to all StudySessions available only through Payload admin.
- For user-facing Payload Local API calls where collection access should apply, pass `user` with `overrideAccess: false`.
- For StudySession question rendering, authorize the owned StudySession first, then fetch the locked question version with trusted server access.
- Treat unauthenticated access as a login redirect.
- Treat authenticated wrong-role or wrong-owner access as `notFound()`.
- Add Playwright coverage for login flow behavior, including successful login, failed login, protected-route redirect, post-login redirect, and logout.
- When implementing this stage, explore exact Payload/Next.js API details in the codebase and official docs; feel free to ask the user where product behavior is still ambiguous.

Behavior implemented:

- Added shared auth helpers for current Payload user lookup, role checks, safe relative redirects, and protected route handling.
- Added Payload access helpers for authenticated, admin-only, and owner-or-admin collection access.
- Added optional multi-role `users.roles` values `admin` and `student`, saved to JWT.
- Restricted Payload admin access to users with `admin`, while preserving first-user creation and forcing the first user to receive `admin`.
- Restricted authoring collections to admin-only access: question, taxonomy, syllabus, syllabus coverage, and media management writes.
- Made StudySession ownership required and owner-scoped for read/update/delete, with admin access available through Payload admin.
- Added repository/service support for user-scoped StudySession Local API calls with `overrideAccess: false`.
- Added frontend `/login` using Payload's `@payloadcms/next/auth` login helper and current-session logout using the logout helper.
- Added unauthenticated `/question/**` redirect to `/login?redirect=...`, admin-only `/question/**` access, and safe post-login redirects.
- Updated frontend navigation to show login when signed out, logout when signed in, and the admin link only for admin users.
- Added login-flow Playwright coverage for failed login, successful login, protected-route redirect, post-login redirect, logout, and wrong-role not-found behavior.

Generation and migration completed:

- `bun run generate:types` passed.
- `bun run migrate:create` created `src/migrations/20260512_150731.ts` and JSON snapshot.
- Migration backfills existing users to `admin` and `student` and fails if any existing StudySession has no owner before enforcing non-null `user_id`.
- `bun run migrate` passed.

Verification completed:

- `bun run lint` passed with existing warnings.
- `bun run typecheck` passed.
- `bun run test:unit` passed.
- `bun run build` passed with existing warnings.
- `bun run test:e2e` passed.
- Playwright MCP inspection completed for `/login`, protected-route redirect to login, and failed-login feedback.

Notes:

- Context7 was used for Payload v3 auth/access and Next.js App Router redirect/protected-route documentation.
- Browser inspection showed the existing missing `/favicon.ico` 404 console error; no new functional blocker was found.

### Stage 6: Server Actions

Status: Completed

- Add StudySession actions with `next-safe-action`.
- Submit action validates required answers and redirects back to review.
- Skip action persists `skipped` and redirects to next question or stays on the last question.
- Flag action sets absolute `{ flagged }` and returns typed success/error data.
- Keep submit tamper errors as hard failures.
- Keep Continue as navigation/no-op, not a mutation.

Behavior implemented:

- Added `src/app/actions/study-session-actions.ts` with submit, skip, and absolute flag server actions.
- Added `src/app/actions/study-session-action-utils.ts` for one-based StudySession question paths, one-based-to-zero-based index conversion, and indexed FormData parsing.
- StudySession actions require `student` role before calling user-scoped service operations.
- Submit action parses indexed answer rows: `answers.0.partId`, `answers.0.type`, and `answers.0.value`.
- Submit success redirects back to the same StudySession question path for review.
- Skip success redirects to the next one-based question path, or stays on the last question.
- Flag action returns only `{ flagged }` on success.
- Expected submit/skip business errors return typed action data; not-found and out-of-range cases map to `notFound()`.
- Added `StudySessionQuestionIncompleteAnswerError` so missing or blank required answers are returned as `neverthrow` business errors.
- Kept malformed/tampered answer payloads, such as duplicate parts, wrong answer types, unknown parts, and invalid choices, as hard errors.

Verification completed:

- `bun run lint` passed with existing warnings.
- `bun run typecheck` passed.
- `bun run test:unit` passed.
- `bun run build` passed with existing warnings.

Verification target:

- `bun run lint`
- `bun run typecheck`
- `bun run test:unit`
- `bun run build`

### Stage 7: Shared Question UI Refactor

Status: Pending

- Refactor shared question components so both routes use the same UI.
- Keep the shared renderer as a Server Component where possible.
- Inject route-specific behavior into the renderer rather than importing preview or StudySession actions inside shared UI.
- Use tiny client islands only for interactive concerns: submit/skip action state, flag mutation, and timer.
- Submit and Skip action business errors should be displayed with `toast.error(...)`, not inline form messages.
- Remove Save globally.
- Make answer inputs required globally.
- Use native HTML required validation for all answer types where possible, with service business errors as the fallback.
- In review mode, keep answer controls disabled; persisted or URL-backed state is the source of truth and hidden replay values are not needed.
- Use one question-level Flag control, not repeated per-part flag controls.
- Use `shuffleKeyBase` for deterministic MCQ ordering.
- Inject route-specific submit, skip, continue, and flag behavior.
- Use indexed FormData rows for submit payloads: `answers.0.partId`, `answers.0.type`, and `answers.0.value`.
- Continue should be a Next `<Link>` when a next question exists, to keep it as pure navigation and remain compatible with future route prefetching.
- Add tiny timer client island.
- Timer displays session elapsed time: `begunAt` to now for started sessions, and `begunAt` to `endedAt` for finished sessions.
- Add flag mode adapters:
- Preview: URL-backed SWR optimistic mutation using Next router `replace`.
- StudySession: persisted SWR optimistic mutation.

Verification target:

- `bun run lint`
- `bun run typecheck`
- `bun run test:unit`
- `bun run build`

### Stage 8: StudySession Route

Status: Pending

- Add `/study-session/[studySessionId]/question/[questionIndex]/page.tsx`.
- Treat `questionIndex` in the URL as a one-based question number; convert to zero-based before calling services.
- Parse numeric params; invalid zero/negative/non-numeric params call `notFound()` before service access.
- Map out-of-range question index service errors to `notFound()`.
- Render `started` and `finished` sessions.
- If an owned session is `notStarted`, render a simple route-level unsupported message from the service business error; do not add a Start button in this stage.
- Never use draft mode.
- Build `shuffleKeyBase` from `studySessionId`, `questionIndex`, and canonical question ID.
- Freeze timer when finished.
- Lock answers and Skip after answered; keep Flag available.
- Finished sessions remain viewable in review mode; do not redirect to a summary route in this stage.
- Skipped questions are editable when revisited, and Skip remains available on skipped questions.
- Load only the current question's flag state for now; keep decisions compatible with future Next route prefetching or a session navigator.

Verification target:

- `bun run lint`
- `bun run typecheck`
- `bun run test:unit`
- `bun run build`
- `bun run test:e2e` if stable test data exists or is added.

### Stage 9: Preview Route Update

Status: Pending

- Replace `seed` with `previewStudySessionId`.
- Redirect `/question/[id]` to add `previewStudySessionId` when missing.
- Preserve `previewStudySessionId` through submitted review URLs.
- Use `previewStudySessionId` in both the URL and form/action payload; derive `shuffleKeyBase` internally.
- Keep preview state URL-backed: `previewStudySessionId`, optional `submitted=1`, optional `flagged=1`, and `a.<partId>=...` answer params.
- Keep preview answers in the URL so refresh/share preserves review state.
- Preview flag is URL-backed, not local-only; update it with Next router `replace` to avoid browser history spam.
- Use synthetic preview session state:
- Before submit: `started`.
- After submit: `finished`.
- Preview question index is internal `0`.
- Preview flag is URL-backed but fed into the shared renderer with the same prop shape as the persisted StudySession flag.
- Preview skip/continue are no-op for visual parity.
- Preview Continue is disabled/no-op because preview has only internal question index `0`.

Verification target:

- `bun run lint`
- `bun run typecheck`
- `bun run test:unit`
- `bun run build`
- `bun run test:e2e` if stable test data exists or is added.

### Stage 10: SWR And Sonner

Status: Pending

- Add `swr`.
- Add shadcn `sonner` with `bunx shadcn@latest add @shadcn/sonner`.
- Add `Toaster` to frontend layout.
- Implement SWR flag cache for only `{ flagged }`.
- Use SWR for both preview and StudySession flag controls with the same `{ flagged }` cache shape.
- Preview SWR mutation does not call an endpoint; it updates the URL with Next router `replace` and uses `revalidate: false`.
- StudySession SWR mutation calls the persisted flag server action and populates the canonical server result.
- Use optimistic update, rollback on error, and populate canonical result.
- Coalesce rapid clicks with last-write-wins semantics: one in-flight request and one follow-up if desired state changed.
- Show `toast.error(...)` on flag failure and roll back to the last confirmed value.

Verification target:

- `bun run lint`
- `bun run typecheck`
- `bun run test:unit`
- `bun run build`
- Browser inspection with Playwright MCP for affected UI.

### Stage 11: Final Verification

Status: Pending

- Run `bun run generate:types` if Payload types changed during refinement.
- Run `bun run migrate` if not already verified.
- Run `bun run lint`.
- Run `bun run typecheck`.
- Run `bun run test:unit`.
- Run `bun run build`.
- Run `bun run test:e2e`, including the login flow coverage added in the auth stage.
- Use Playwright MCP for interactive inspection of changed frontend flows.
- In the PR/implementation summary, explicitly note that AC 7 changed from stored random seed to derived `shuffleKeyBase`.
