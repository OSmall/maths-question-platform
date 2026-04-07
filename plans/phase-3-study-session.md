# Phase 3: Study sessions and persisted attempts

## Goal

Introduce a real `StudySession` model so a learner can move through a defined list of question versions, persist answers
and review state, and continue from one question to the next.

## Why this phase comes last

- It is the most cross-cutting feature.
- It touches persistence, routing, auth, UI state, evaluation, and question-version handling.
- It benefits from the earlier taxonomy and authoring improvements but does not block them.

## Core outcome

Replace the current URL-based proof of concept with a persisted study-session flow.

## Current limitations being replaced

- Question state is stored in search params.
- Submission only redirects and does not persist.
- Question `version` and `index` are placeholders.
- Flagged and saved state are local-only UI toggles.
- Continue/skip/session metrics are mostly placeholder values.

## Recommended domain model

### `studySession`

- `user` - relationship to `users`, required
- `status` - select such as `notStarted`, `inProgress`, `completed`, `abandoned`
- `startedAt`, `completedAt`
- `currentQuestionIndex`
- optional summary fields for denormalized reporting

### `studySessionQuestion`

Use either a nested array in `studySession` or a separate collection if querying/reporting will grow.

- `questionId` - parent question id
- `questionVersionId` - exact Payload version id or another immutable snapshot reference
- `order`
- `state` - `notStarted`, `inProgress`, `submitted`, `reviewed`, `skipped`
- `attempts` - array of submissions
- `isFlagged`
- `isSaved`
- `timeSpentSeconds`

### attempt entry

- `submittedAt`
- `answersByPart`
- `evaluation`
    - `answeredParts`
    - `correctParts`
    - `incorrectParts`
    - per-part correctness and worked-solution payload as needed

## Key architectural decisions

### Question version strategy

- Store an immutable reference to the exact version presented to the learner.
- Prefer storing the Payload version document id rather than only the question id.
- Add repository support for rendering from a version document when present.

### Session routing

- Move from `/question/[id]` to a session-aware route such as:
    - `/study-session/[sessionId]/question/[index]`
    - or `/study-session/[sessionId]` with server-side redirect to the active question

### Evaluation semantics

- Decide whether self-report counts as correctness or only confidence.
- Normalize short-text evaluation consistently with authoring rules.
- Decide whether attempts are append-only or overwrite the current answer.

### Access control

- A learner should only access their own study sessions.
- Admins may need read-only or support access.
- All local API calls acting on behalf of a user should enforce access control.

## Implementation tasks

1. Finalize the domain model and access rules.
2. Add the `studySession` collection and any nested/related attempt structures.
3. Register collections in `src/payload/payload.config.ts`.
4. Create repository functions for:
    - creating a session
    - fetching a session question
    - persisting answers
    - advancing to the next question
    - reading exact question versions
5. Add service-layer orchestration in `src/lib/service/`.
6. Replace URL-param answer persistence in question actions with server writes.
7. Refactor the question page and components to read session-backed state.
8. Replace placeholder summary/action-bar values with real session data.
9. Add migrations and regenerate Payload types.
10. Add unit tests for session services and e2e coverage for the learner flow.

## Product decisions to settle before building

- How a session is created: manual assignment, generated practice set, or ad hoc.
- Whether a learner can retry a question inside the same session.
- Whether worked solutions unlock immediately after first submit.
- Whether skip advances without submission and how it appears in analytics.
- Whether flagged/saved are per question, per attempt, or both.
- Whether session composition is fixed or can be reshuffled mid-session.

## Codebase impact

- High.
- Affects Payload collections, migrations, generated types, repository/service/domain layers, server actions, routing,
  and learner UI.
- Likely requires new tests in both `tests/unit` and `tests/e2e`.

## Risks

- Highest technical and product risk of the three phases.
- Version fidelity can become brittle if the exact question revision strategy is not settled first.
- Session analytics can become difficult to evolve if attempt data is flattened too aggressively.

## Acceptance criteria

- A study session can be created for a user with an ordered list of questions.
- Each rendered question is tied to a specific question version.
- Answers, submission results, flags, and progress are persisted.
- The learner can continue to the next question and later resume the session.
- Placeholder session UI values are replaced by real data.
- Lint, build, unit tests, and e2e tests pass.

## Verification

- `bun run lint`
- `bun run build`
- `bun run test`
- `bun run test:e2e`
