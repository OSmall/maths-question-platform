# Phase 2: Faster question authoring

## Goal

Reduce repeated data entry in the admin question-authoring flow so editors can keep creating related questions without
reselecting the same question-level subtopics each time.

## Why this phase comes second

- It delivers a visible authoring workflow improvement quickly.
- It builds cleanly on the taxonomy work from Phase 1 without requiring syllabus-aware filtering yet.
- It avoids the maintenance cost of a bespoke bulk editor while still improving the editorial workflow.

## Settled product shape

Implement a Payload-native `Save and add another` flow for questions using the existing document actions menu in the
admin edit view.

This phase is no longer a generic sticky-state feature. Instead, it is an explicit carry-forward action:

- An author edits a question and selects one or more question-level `subTopics`.
- From the native 3-dot document menu next to `Publish changes`, they choose `Save and add another`.
- The current question is saved as a draft.
- The author is taken to a fresh question create screen.
- The new question form is prefilled with the previous question's `subTopics`.
- If the author changes the `subTopics` before using `Save and add another` again, the next hop carries the updated
  values.
- If the author navigates away or uses ordinary `Create New`, no carried-forward state persists.

## First-release behavior

- Show `Save and add another` on any persisted question edit screen.
- Place the action in the native Payload 3-dot document menu.
- Keep the existing native `Create New` action unchanged and blank by default.
- Carry forward only top-level `question.subTopics`.
- Serialize carried-forward values in the URL as subtopic IDs.
- Prefill `question.subTopics` only on the subsequent create screen opened by this action.
- Treat each click as a fresh snapshot of the current form state.
- Use draft-saving semantics for v1.

## Explicit non-goals for v1

- No session persistence or browser storage.
- No dedicated clear button.
- No carry-forward for worked-solution subtopics.
- No carry-forward for other fields such as response type or worked-solution defaults.
- No syllabus-based narrowing in this phase.
- No full custom question create view.

## Why this approach is recommended

- It uses a Payload-supported extension point instead of replacing the edit view.
- It keeps the existing admin authoring experience intact.
- It makes the behavior explicit and discoverable through a named action.
- It avoids hidden sticky state that can surprise authors later.
- It keeps scope focused on the workflow improvement with the best cost-to-value ratio.

## Payload-native implementation choice

Use the `question` collection's edit-view `editMenuItems` extension point for the new action.

This is preferred over:

- replacing the whole edit view
- hijacking the publish button
- introducing client-only session state

## Detailed UX flow

### Authoring flow

1. An author opens an existing or autosaved question draft.
2. They set `question.subTopics`.
3. They open the 3-dot menu and click `Save and add another`.
4. The system saves the current question as a draft.
5. On success, the admin routes to the question create screen with query params containing the current subtopic IDs.
6. The create form reads those IDs and pre-populates `question.subTopics`.
7. The author creates the next question.
8. If they use the same action again, the current form's `subTopics` become the next carried-forward values.

### Ordinary navigation remains unchanged

- Clicking native `Create New` should still open a blank question create form.
- Navigating away from the flow should naturally discard the carried-forward values.
- The new behavior should only occur when authors intentionally use `Save and add another`.

## Data and state model

### Carried-forward state

- Lives only in the URL of the next create screen.
- Contains subtopic IDs only.
- Is not stored in Payload drafts, local storage, or session storage.

### Recommended query-param shape

- Use a dedicated param for question-level carried-forward subtopics.
- Keep the value format simple and helper-driven, for example a comma-separated ID list.
- Parse defensively and ignore invalid values.

The exact param name can be chosen during implementation, but it should be specific to this flow and easy to test.

## Admin UI details

### New menu item

- Add a custom edit-menu item component for the `question` collection.
- Label it `Save and add another`.
- It should appear in the same native dropdown that currently contains `Create New`, `Duplicate`, and `Delete`.
- It should only be shown where the document already exists as a persisted question.

### Prefilling `question.subTopics`

- Prefill only on create screens reached through the new action.
- Perform the prefill once on initial load.
- Do not keep any ambient sticky state after that page load.

### Display labels in the picker

- The authoring field should display subtopics with topic context as `Topic / Subtopic`.
- Search params still carry only subtopic IDs.
- The existing stored relationship value remains the subtopic ID list.

Because the built-in relationship field labels are driven by the related collection title, this phase may need a thin
field wrapper around `question.subTopics` so this field can:

- prefill from the carry-forward query param
- display `Topic / Subtopic` labels locally in this authoring flow

This should remain a question-field-specific enhancement, not a broad taxonomy-admin redesign.

## Technical plan

1. Extend `question` collection admin config with custom edit menu item(s).
2. Add a client admin component for the `Save and add another` action.
3. Add a helper to serialize and parse carried-forward subtopic IDs.
4. Add or wrap the `question.subTopics` field component so it can:
   - read carry-forward query params on create pages
   - prefill the relationship field once
   - render `Topic / Subtopic` labels for selected values and options
5. Update the admin import map.
6. Preserve existing validation and preview behavior.

## Suggested file impact

- `src/payload/collections/question.ts`
  - Register the custom edit menu item.
  - Register any field-level admin component needed for `question.subTopics`.
- `src/payload/components/admin/`
  - Add the menu item component.
  - Add the `question.subTopics` field wrapper if needed.
- small helper module for parsing and serializing carry-forward query params
- `src/app/(payload)/admin/importMap.js` or regenerated equivalent output

## Validation and behavior to preserve

- Existing question validation rules in `src/payload/collections/question.ts` must continue to work.
- Existing autosave behavior must continue to work.
- Existing live preview behavior must continue to work.
- Existing draft and publish actions must continue to work.
- Existing blank `Create New` behavior must continue to work.

## Risks

### Technical risk

- Low to medium.
- Main complexity is integrating with Payload's relationship field behavior without over-customizing the admin UI.

### Product risk

- Low.
- The feature is explicit and narrow, but it will not satisfy teams expecting a full bulk-question editor.

## Acceptance criteria

- Persisted question screens show a `Save and add another` action in the native 3-dot menu.
- Clicking the action saves the current question as a draft.
- After save, the admin opens a new question create screen.
- The new screen pre-populates `question.subTopics` using the previous question's subtopic IDs.
- If the author changes `question.subTopics` before repeating the action, the next create screen uses the updated IDs.
- Native `Create New` still opens a blank question.
- No carry-forward state survives ordinary navigation away from the flow.
- Existing validation, autosave, and live preview continue to function.
- Lint and relevant tests pass.

## Verification

- `bun run generate:importmap` if new admin components are added
- `bun run lint`
- `bun run build`
- `bun run test`
- `bun run test:e2e`

## Follow-up scope after v1

- Persist recent subtopic sets per browser session.
- Add syllabus-aware narrowing or filtering.
- Expand carry-forward to additional fields if authors request it.
- Revisit whether subtopic label formatting should become a broader admin-wide taxonomy display improvement.
- Explore a more tailored bulk-authoring experience only if the lightweight flow proves insufficient.
