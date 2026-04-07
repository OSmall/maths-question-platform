# Phase 1: Syllabus coverage

## Goal

Add syllabus modelling to Payload so admins can define syllabus coverage over the existing `topic` / `subTopic`
taxonomy.

For each syllabus / subtopic pair, admins should be able to mark the subtopic as either:

- `included`
- `assumedKnowledge`

If no row exists for a syllabus / subtopic pair, that pair is treated as `excluded`.

This phase includes both the underlying Payload schema and the primary admin UX for editing coverage.

## Why this phase comes first

- It builds directly on the existing taxonomy without changing learner flows.
- It creates reusable curriculum metadata that later authoring and study-session features can rely on.
- It defines the semantics of syllabus coverage before question filtering or session composition depend on it.

## Current taxonomy size

As of planning time, the database contains:

- `27` topics
- `495` subtopics

That size is large enough that phase 1 should assume a substantial matrix-style admin interface, not just a tiny manual
lookup table.

## Scope

- Add a `syllabus` collection.
- Add a `syllabusSubTopic` join-style collection.
- Store only positive syllabus mappings:
    - `included`
    - `assumedKnowledge`
- Treat absence of a mapping row as `excluded`.
- Prevent duplicate `syllabus + subTopic` rows.
- Make the primary admin UX a custom coverage matrix.
- Keep a fully editable raw row view available as a fallback.

## Confirmed product decisions

### Coverage model

- Coverage is partial, not complete.
- Admins do not need to create explicit rows for excluded subtopics.
- `excluded` is represented by the absence of a `syllabusSubTopic` row.
- The same `subTopic` can appear in multiple syllabuses with different statuses.

### Status semantics

- `included` means the subtopic is explicitly in scope for the syllabus.
- `assumedKnowledge` means the subtopic is relevant background knowledge for the syllabus but should not by itself make
  a question eligible in later syllabus-aware question selection logic.
- The exact question-selection logic is out of scope for this phase, but the distinction is intentional and should be
  preserved in the data model.

### Syllabus metadata

- Keep `syllabus` minimal in phase 1.
- Use only a required `name` field.
- Do not add `code`, `qualification`, `tier`, `year`, ordering, or notes yet.
- Make `syllabus.name` unique using built-in Payload functionality.

### Ordering

- No syllabus-specific subtopic ordering in phase 1.
- Matrix rows are ordered alphabetically by `topic.name`, then alphabetically by `subTopic.name` within each topic.
- Matrix columns are ordered alphabetically by `syllabus.name` for now.
- Column ordering is a presentational default, not a committed long-term schema choice.

### Testing and delivery scope

- The custom matrix is part of phase 1, not a later follow-up.
- Phase 1 requires unit tests for validation helpers and matrix diff/save logic.
- Do not require dedicated admin e2e coverage for the first cut.

## Data model

### `syllabus`

- `name` - required text, unique

Recommended admin setup:

- `useAsTitle: 'name'`
- minimal create/edit UI

### `syllabusSubTopic`

- `syllabus` - relationship to `syllabus`, required
- `subTopic` - relationship to `subTopic`, required
- `status` - select enum, required, default `included`
    - `included`
    - `assumedKnowledge`

Deliberate omissions:

- no `topic` field on the join row; derive topic through `subTopic`
- no `notes`
- no `excluded` stored value
- no ordering field

### Uniqueness and integrity

- Enforce a compound uniqueness rule on `syllabus + subTopic`.
- Add both:
    - a database-level unique constraint/index
    - a friendly Payload validation error before save
- Deleting a `syllabus` or `subTopic` should remove related `syllabusSubTopic` rows.
    - Verify whether the generated migration already gives the desired cascade behavior.
    - If not, add explicit cleanup logic.

## Admin information architecture

### Naming

- Present the feature in the admin as `Syllabus Coverage`.
- Keep the underlying collection slug as `syllabusSubTopic`.

### Visible admin entry points

- `Syllabus` remains a normal collection for creating, renaming, and deleting syllabuses.
- `Syllabus Coverage` is the main admin entry point for editing coverage.
- The raw `syllabusSubTopic` row list remains available, but hidden from the main sidebar.
- The matrix view should expose a prominent `View raw rows` link.

### Editing responsibilities

- The matrix is coverage-only.
- Admins must still create/edit/delete:
    - syllabuses in the `Syllabus` collection
    - topics and subtopics in the existing taxonomy collections

## Primary admin UX: coverage matrix

### Overall shape

- Build a custom matrix-style admin view as the primary editing surface.
- Treat it as the default experience for `Syllabus Coverage`.
- Keep the raw row list as a secondary fallback route.

### Matrix structure

- Columns: all syllabuses, shown by default
- Rows: all existing subtopics, generated from the full taxonomy
- Group rows by topic
- Show topic sections expanded by default
- Allow topic sections to be collapsed manually
- Within each topic section, show only the `subTopic` name in the row label
- Use a sticky header row and sticky first column
- Use a sticky actions bar for save/discard/status

### Cell model

Each matrix cell always exposes all three conceptual states:

- `Excluded`
- `Included`
- `Assumed`

Storage mapping:

- `Included` -> create or keep a `syllabusSubTopic` row with `status = included`
- `Assumed` -> create or keep a `syllabusSubTopic` row with `status = assumedKnowledge`
- `Excluded` -> delete any existing `syllabusSubTopic` row for that pair

### Cell interaction

- Show the cell control at all times.
- Use a compact always-visible 3-state segmented control, not a dropdown.
- Optimize for fast repeated editing rather than maximum density.
- Do not add topic-level bulk actions in phase 1.

### Navigation within the matrix

- No built-in search/filter in phase 1.
- No topic jump list in phase 1.
- Rely on:
    - alphabetical row order
    - expanded topic sections
    - manual collapse
    - browser `Cmd+F` for quick topic lookup

### Empty states

- If there are no syllabuses, show a create-syllabus link in the column-header area.
- If there are no subtopics, show a taxonomy-management link in the row-header area.
- If both are missing, show both cues.

### Feedback and safety

- Track unsaved changes visibly.
- Highlight changed cells.
- Warn before leaving the page with unsaved changes.
    - Use the built-in browser/tab-close warning behavior.
- Provide `Save coverage` and `Discard changes` actions.
- Confirm `Discard changes` with the built-in browser confirm dialog.
- After successful save:
    - keep the matrix in place
    - preserve scroll position
    - clear dirty state
    - show a lightweight admin toast
- After failed save:
    - keep local unsaved edits intact
    - keep dirty state intact
    - show a lightweight admin toast/error message

### Concurrency

- Use last-write-wins behavior in phase 1.
- Do not add stale-write detection or conflict resolution yet.

## Secondary admin UX: raw row editor

- Keep a fully editable raw `syllabusSubTopic` row view.
- This is a fallback/debugging path, not the primary workflow.
- Keep the row editor simple:
    - no custom duplicate-prevention filtering in the picker
    - rely on friendly validation plus the DB constraint
- Improve readability so `subTopic` is shown as `Topic / Subtopic` in list and picker contexts where practical.

## Save semantics

### Matrix loading

- Load all `syllabus` documents.
- Load the full taxonomy (`topic` plus nested `subTopic` rows).
- Load existing `syllabusSubTopic` rows.
- Build a derived full grid in memory where unmapped pairs default to `Excluded`.

### Client-side state

- Track the initial loaded state.
- Track current edited state.
- Compute a local diff for dirty highlighting and save payload generation.

### Save payload

- Submit only changed cells, not the full matrix snapshot.

### Server-side persistence

- Apply the changed-cell diff atomically in one save operation.
- Within the transaction:
    - create rows for `Excluded -> Included/Assumed`
    - update rows for `Included <-> Assumed`
    - delete rows for `Included/Assumed -> Excluded`
- If any part fails, persist none of the changes.

## Suggested implementation tasks

1. Add the `syllabus` collection config in `src/payload/collections/`.
2. Add the `syllabusSubTopic` collection config in `src/payload/collections/`.
3. Register both collections in `src/payload/payload.config.ts`.
4. Add a compound unique index / migration constraint for `syllabus + subTopic`.
5. Add friendly Payload validation for duplicate `syllabus + subTopic` rows.
6. Add admin labels and defaults so the feature is presented as `Syllabus Coverage`.
7. Add admin display improvements so subtopics are rendered as `Topic / Subtopic` where it matters.
8. Build the custom matrix admin view as the primary coverage editor.
9. Add a linked fallback raw-row route/view and keep it fully editable.
10. Build matrix state helpers that:

- derive the full grid from sparse rows
- compute changed cells
- convert changed cells into create/update/delete operations

11. Add an atomic save path for changed-cell diffs.
12. Add client-side dirty-state handling:

- changed-cell highlighting
- sticky save/discard bar
- discard confirmation
- leave-page warning
- success/error toast feedback

13. Generate a migration with `bun run migrate:create`.
14. Regenerate Payload artifacts with:

- `bun run generate:types`
- `bun run generate:importmap`

15. Add unit tests for:

- duplicate-validation helpers
- matrix diff/save helpers

## Suggested implementation shape

### Data and validation helpers

Likely helper responsibilities:

- validate duplicate `syllabus + subTopic`
- derive topic-grouped matrix rows
- overlay sparse coverage rows onto the full taxonomy
- compute changed-cell diffs
- map changed cells into create/update/delete operations

### Admin architecture

Recommended implementation approach:

- make the matrix the primary `Syllabus Coverage` admin experience
- hide the raw row list from the main sidebar
- expose the raw row list from a prominent `View raw rows` link in the matrix view

The exact Payload routing implementation can follow whichever admin extension point is most maintainable, but the UX
contract should remain:

- matrix first
- raw rows second
- both operate on the same canonical collection data

## Codebase impact

- Medium.
- Touches Payload schema, migration generation, generated types, admin custom views/components, and test helpers.
- Does not yet require changes to learner-facing rendering or question-selection logic.

## Risks

- The main complexity is no longer the schema; it is the custom matrix admin UX.
- The biggest implementation risk is correctly translating full-grid edits into sparse atomic create/update/delete
  operations.
- With `495` subtopics, the matrix will be long, so sticky layout and clear row grouping are important.
- Concurrency is intentionally simple in phase 1; last write wins may need revisiting later if multi-admin editing
  becomes common.

## Acceptance criteria

- Admins can create a syllabus.
- Admins can edit syllabus coverage through a matrix-first admin interface.
- Every syllabus / subtopic cell supports the conceptual states `Excluded`, `Included`, and `Assumed`.
- `Excluded` is represented by the absence of a join row, not a stored enum value.
- Duplicate `syllabus + subTopic` rows are prevented by both friendly validation and a DB-level constraint.
- The same `subTopic` can appear in multiple syllabuses with different statuses.
- The matrix loads all subtopics from the taxonomy, grouped by topic.
- The matrix supports atomic save of changed cells only.
- The matrix provides visible dirty-state feedback, discard confirmation, leave-page warning, and save feedback toast.
- A fully editable raw-row fallback view remains available from the matrix.
- Types, migrations, and import map generate successfully.
- Lint, build, and unit tests pass.

## Verification

- `bun run lint`
- `bun run build`
- `bun run test:unit`
- manual QA of the admin matrix flow
