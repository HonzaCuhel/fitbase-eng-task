# Codex Review — Superpowers Plan (2026-03-31)

Reviewed file: `docs/superpowers/plans/2026-03-31-fitbase-tasks.md`  
Reference spec: `TASKS.md`

## Verdict
The plan is strong overall and maps well to all 4 required tasks, but it should be corrected before implementation.

## Findings

### 1) High — Task 3 i18n requirement is contradicted by hardcoded English fallbacks
The plan says to verify all text is translated, but the proposed `ClassOverview.vue` still includes hardcoded English fallback strings.

- `docs/superpowers/plans/2026-03-31-fitbase-tasks.md:818` (`"No description available."`)
- `docs/superpowers/plans/2026-03-31-fitbase-tasks.md:837` (`"No schedule set."`)
- `docs/superpowers/plans/2026-03-31-fitbase-tasks.md:860` (`"Not set"`)
- `docs/superpowers/plans/2026-03-31-fitbase-tasks.md:921` / `:922` (`"TBD"`)
- `docs/superpowers/plans/2026-03-31-fitbase-tasks.md:949` (verification says all text is translated)

Why this matters: the implementation would fail its own acceptance criterion in multilingual mode.

### 2) Medium — AI insights are built from paginated/filtered members, not full enrollment data
The AI panel is wired to `membersStore.members`, which is the current page and can be filtered by status/search.

- `docs/superpowers/plans/2026-03-31-fitbase-tasks.md:1288` (`:members="membersStore.members"`)
- `docs/superpowers/plans/2026-03-31-fitbase-tasks.md:1348` (fetch uses store defaults)
- Current store behavior confirms pagination/filtering:
  - `stores/members.js:7` (`limit: 50`)
  - `stores/members.js:37` (status filter applied)

Why this matters: insights can be misleading for classes with >50 members or active filters.

### 3) Medium — AI stream error handling can degrade silently
The draft component does not check `response.ok`, and parse failures are swallowed.

- `docs/superpowers/plans/2026-03-31-fitbase-tasks.md:1183` (fetch call)
- `docs/superpowers/plans/2026-03-31-fitbase-tasks.md:1221` / `:1230` (empty catch blocks for JSON parse)
- `docs/superpowers/plans/2026-03-31-fitbase-tasks.md:1233` (generic error toast only in outer catch)

Why this matters: 401/500 or malformed responses can appear as “no insights” instead of a clear actionable error.

### 4) Low — Existing export fallback bug in members store remains unaddressed
While touching `stores/members.js`, the plan does not account for an existing undefined `t(...)` fallback.

- `stores/members.js:100`

Why this matters: not a blocker for the assignment tasks, but it is a nearby reliability issue in an edited file.

## Recommendation
Keep the plan structure and sequencing. Before implementation, patch:

1. Task 3 fallback strings to i18n keys.
2. Task 4 data source to ensure unfiltered/full member input for analysis (or explicitly constrain insight scope in UI copy).
3. Task 4 error handling (`response.ok`, parse/error surface).

