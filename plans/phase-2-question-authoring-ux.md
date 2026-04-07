# Phase 2: Faster question authoring

## Goal

Reduce repeated data entry in the admin question-creation flow so question creators can set subtopics once and then
enter multiple questions quickly.

## Why this phase comes second

- It delivers a visible workflow improvement quickly.
- It can reuse the taxonomy work from Phase 1 if syllabus-aware filtering is added later.
- It avoids the complexity of learner-session persistence while still improving the editorial system.

## Recommended scope for the first release

Implement a lightweight sticky-subtopic workflow instead of a full bespoke bulk editor.

### First-release behavior

- A question creator selects one or more `subTopics` up front.
- After saving a question, they can choose `Save and add another`.
- The next new question form opens with the same `subTopics` prefilled.
- The creator can clear or change the carried-forward subtopics at any time.

## Nice-to-have follow-up scope

- Persist recently used subtopic sets per browser session.
- Offer syllabus-based filtering for subtopic selection.
- Add a small custom header panel showing the active subtopic set.
- Add templates for common question structures.

## Implementation options

### Option A: Smallest change, recommended

- Add a custom admin control or edit component for the `question` collection.
- Pass the selected subtopics forward through the create flow, likely via query params or local admin state.
- Prefill the `subTopics` relationship field on the next create screen.

### Option B: Full custom create view

- Replace more of the default Payload question edit experience.
- Support rapid entry of multiple questions in one tailored flow.
- This is more powerful but carries much higher maintenance cost.

## Implementation tasks

1. Review the Payload admin extension point to use for the `question` collection.
2. Add custom admin component(s) for the question create/edit flow.
3. Update the admin import map if new components are added.
4. Prefill the `subTopics` relationship field on the next create action.
5. Preserve the existing validation rules in `src/payload/collections/question.ts`.
6. Add tests for any helper logic that transforms carried-forward values.
7. Regenerate import map if needed.

## Product decisions to settle before building

- Whether the carried-forward subtopics should apply only to newly created questions or also while editing existing
  ones.
- Whether the carry-forward state should live in the URL, browser storage, or Payload draft state.
- Whether authors also want other sticky fields, such as response type or worked-solution defaults.
- Whether syllabus selection should become the primary way to narrow subtopic choices.

## Codebase impact

- Low to medium.
- Mostly isolated to admin UI customization, import map updates, and possibly small collection config changes.
- Little or no impact on frontend learner flows.

## Risks

- Low technical risk if kept to sticky defaults.
- Medium product risk if the team expects true batch authoring but the first release only carries forward subtopics.

## Acceptance criteria

- Question creators can create a question with selected subtopics.
- They can immediately create another question without re-entering the same subtopics.
- They can change or clear the prefilled values.
- Existing question validation and live preview continue to work.
- Lint and relevant tests pass.

## Verification

- `bun run lint`
- `bun run build`
- `bun run test`
- `bun run test:e2e`
