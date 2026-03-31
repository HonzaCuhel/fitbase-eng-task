# FitBase Tasks Implementation Plan

This document is a **plan only** for the tasks in `TASKS.md`.
No implementation is included here.

**Revision history:**
- v1: Initial plan.
- v2 (2026-03-30): Integrated review feedback from Gemini CLI and Codex. Addressed 2 high-severity logic gaps, 2 medium consistency gaps, 2 performance/UX recommendations, and added E2E test update plan.
- v3 (2026-03-31): Revised status semantics to preserve `pending` and introduce distinct `waitlisted` state.
- v4 (2026-03-31): AI insights endpoint revised to receive all data from frontend (no server-side DB fetch), added prompt injection mitigations, and added concrete example insights to the prompt spec.
- v5 (2026-03-31): Codex review fixes — removed stale Requirements Mapping line (classId/server-fetch), clarified "enrolled" = pending in public flow, fixed duplicate risk item numbering (5→6, 6→7), added Decision #6 to lock in pending-vs-waitlisted public outcome semantics.

## Goal

Deliver all four tasks with minimal regression risk, aligned with existing FitBase code patterns (Nuxt 3 + Pinia + Koa + Mongoose + i18n + DS components).

## Decisions Locked In

1. `pending` remains a valid business state (awaiting confirmation).
2. Status semantics for enrollments:
   - `1 = confirmed`
   - `0 = pending`
   - `2 = waitlisted`
   - `-1 = declined`
3. Public class CTA when full should be **Join waitlist** (not disabled).
4. AI insights endpoint receives all class and enrollment data from the frontend (no server-side DB fetch). This mirrors the `generateDescription` pattern — the frontend serializes what it already has in the store and sends it in the request body.
5. If an admin manually sets a waitlisted member to confirmed while the class is full: **reject with `Class is full`**. Do not auto-demote others.
6. "Enrolled" in the original requirement wording (Task 2, requirement 4) means **submitted as pending (`status.confirmation = 0`)** — i.e., placed in the normal queue, not yet confirmed. The public success message differentiates `pending` (normal queue) from `waitlisted` (`2`). A public user never lands at `confirmed` (`1`) directly.

---

## Task 1 — Bug Fix: Schedule Session Edit Not Updating UI

### Requirement
Editing an existing schedule session should immediately update UI state without page refresh.

### Root Cause
`updateSchedule()` in `stores/class.js` (lines 55–57) sends the API call but discards the returned session — local store state is never mutated. `addScheduleSession` and `removeScheduleSession` in the same file both correctly mutate state; `updateSchedule` is the odd one out.

### Planned Changes

- File: `stores/class.js`
- Action `updateSchedule(classId, sessionIndex, data)`:
  1. Await `PUT /classes/:id/schedule/:sessionIndex`
  2. Replace local entry: `this.class.schedule.splice(sessionIndex, 1, returnedSession)`
  3. Return the updated session

### Proof / Acceptance

1. Open class schedule page.
2. Edit session room/time.
3. Save.
4. Confirm updated values appear immediately without manual reload.

---

## Task 2 — Waitlist Feature (API + Stores + Components + i18n)

### Requirements Mapping

1. If class is full, new enrollments become waitlisted.
2. If a confirmed member is removed or declines, first waitlisted member auto-promotes to confirmed.
3. UI shows waitlist count alongside enrollment count.
4. Public enrollment page differentiates the outcome: pending (normal queue) vs waitlisted.

### Backend Plan

#### 2.1 Data Model and Counters

- File: `api/routes/class/_class.schema.js`
  - Add `waitlistCount: { type: Number, default: 0 }`.

- File: `api/routes/class/_class.functions.js`
  - Extend `updateEnrollmentCount` to compute and persist both counters in one call:
    - `enrollmentCount` ← count of `status.confirmation === 1`
    - `waitlistCount` ← count of `status.confirmation === 2`
  - Update `formatClassForResponse` to include `waitlistCount` in the returned object.

#### 2.2 Status Filter Bug Fix (Required)

- File: `api/routes/member/_member.controller.js`, line 14
- Current: `if (ctx.query.status)` — falsy when status is `0`, silently ignores pending filter
- Fix: `if (ctx.query.status !== undefined)`
- This fix is a prerequisite for status-based filtering to work correctly.

#### 2.3 Schema Comment

- File: `api/routes/member/_member.schema.js`
  - Update the inline comment on `status.confirmation` to:
    - `-1=declined, 0=pending, 1=confirmed, 2=waitlisted`

#### 2.4 Enrollment + Promotion Logic

- File: `api/routes/member/_member.controller.js`

**`addMember`**
1. Fetch the class doc to check `enrollmentCount >= general.capacity`.
2. Default incoming `status.confirmation` to `0` (`pending`) when not provided.
3. If class is full and incoming/new status is an enrollment status (`0` or `1`), set it to `2` (`waitlisted`) before insert.
4. _(Capacity guard for explicit confirm-while-full is enforced in `updateMember` — see below.)_

**`addMembersMany`**
- Apply capacity check per member during the loop (re-read live confirmed count each iteration, or track running total from inserted confirmed members in this batch).
- Keep default import status as `0` (`pending`) when capacity is available.
- If class is full at insertion time, set status to `2` (`waitlisted`) for that row.

**`updateMember`** _(Critical — review finding #1)_
- **Capacity guard:** When `status.confirmation` changes from non-confirmed (`0` or `2`) to `1`, fetch class doc and check `enrollmentCount >= general.capacity`. If full → `ctx.throw(400, 'Class is full')`. This is the primary admin UI path for manual promotion (`MemberList.vue` calls `updateMember` via `updateStatus(memberId, 1)`).
- When `status.confirmation` changes from `1` to `-1` (decline), attempt promotion after update.
- Promotion must happen **before** `updateEnrollmentCount` is called, so counters reflect the final state.

**`deleteMember`**
- If deleted member had `status.confirmation === 1`, attempt promotion before `updateEnrollmentCount`.

**Promotion logic (shared helper)**
- Query: `{ class: classId, 'status.confirmation': 2 }` sorted by `enrolledAt: 1` (ascending — oldest waitlist entry first).
- Promote: `findOneAndUpdate` to set `status.confirmation = 1`.
- Call `updateEnrollmentCount` after promotion completes.
- **Index recommendation** _(Gemini review)_: Ensure `enrolledAt` field is indexed on the Member schema to maintain FIFO query performance as the collection grows. Add to schema or seed setup: `MemberSchema.index({ class: 1, 'status.confirmation': 1, enrolledAt: 1 })`.

**`getMembers` stats**
- Keep `pending` and add `waitlisted` in the returned stats object:
  ```js
  pending: await ctx.Member.countDocuments({ ...find, 'status.confirmation': 0 }),
  waitlisted: await ctx.Member.countDocuments({ ...find, 'status.confirmation': 2 })
  ```

#### 2.4 Seed Alignment

- File: `api/seed.js`
  - Update class count updater to set both `enrollmentCount` and `waitlistCount`.
    - `enrollmentCount` from `status.confirmation === 1`
    - `waitlistCount` from `status.confirmation === 2`

### Frontend Plan

#### 2.5 Members Admin Flow

- File: `stores/members.js`
  - Keep `pending` in `stats` and add `waitlisted`.
  - **Update `formatMembersForExport`** (line ~93): support both `member.status.pending` and `member.status.waitlisted` mappings.

- File: `components/member/MemberForm.vue` _(Review finding #2)_
  - Keep submitted `status.confirmation` as `0` (`pending`) for standard add-member flow.
  - Backend enforces full-capacity conversion to `2` (`waitlisted`).

- File: `components/member/MemberStatusBadge.vue`
  - Map statuses explicitly:
    - `1 -> confirmed`
    - `0 -> pending`
    - `2 -> waitlisted`
    - `-1 -> declined`

- File: `pages/classes/[_id]/members.vue`
  - Status filters: keep `pending`, add `waitlisted`.
  - Stat tiles: show both `stats.pending` and `stats.waitlisted`.

#### 2.6 Public Enrollment Flow

- File: `stores/memberApp.js`
  - Keep submitted status as `confirmation: 0` (`pending`).
  - Backend applies capacity logic and converts to `confirmation: 2` (`waitlisted`) if class is full.

- File: `components/app/AppEnrollButton.vue`
  - When `classData.isFull`, render an active button (not a disabled div) with `app.joinWaitlist` text that navigates to the enroll page.

- File: `pages/app/[gym]/enroll/[classId].vue`
  - After successful enrollment, check the returned member's `status.confirmation`:
    - `=== 2` → show `app.waitlistSuccess`
    - otherwise → show `app.enrollSuccess`

#### 2.7 Waitlist Count Visibility

Show `waitlistCount` alongside enrollment count in:

- `components/class/ClassCard.vue`
- `components/class/ClassOverview.vue` _(Review finding #3 — this component already shows enrollment/capacity and is being refactored in Task 3; add waitlist count during the refactor)_
- `components/app/AppClassDetail.vue`
- `components/app/AppClassCard.vue` (full-state messaging)
- `components/dashboard/DashboardUpcoming.vue` (recommended for consistency)

### i18n Plan

Update `locales/en.json`, `locales/cs.json`, `locales/es.json`.

**Add to `member.status`:**
```json
"pending": "Pending",
"waitlisted": "Waitlisted"
```
Note: `enrollment.status.waitlisted` already exists (line 130 of `en.json`); add `member.status.waitlisted` while preserving `member.status.pending`.

**Add to `class`:**
```json
"waitlistCount": "{count} waitlisted",
"waitlistOpen": "Waitlist open"
```

**Add to `app`:**
```json
"joinWaitlist": "Join Waitlist",
"waitlistSuccess": "You're on the waitlist! We'll notify you if a spot opens."
```

### Proof / Acceptance

1. In a class with capacity available, add member (admin/public) and verify status is `pending` (`0`) unless explicitly changed.
2. Fill class to confirmed capacity.
3. Add next member (admin/public) and verify saved status is `waitlisted` (`2`).
4. Decline/remove one confirmed member.
5. Verify first waitlisted becomes confirmed automatically.
6. Verify both `enrollmentCount` and `waitlistCount` update in class/public UI.
7. Verify public success copy differentiates waitlisted vs non-waitlisted outcome.
8. Verify status filters for `pending` (`0`) and `waitlisted` (`2`) both work.

---

## Task 3 — Refactor `ClassOverview.vue`

### Requirement
Refactor component to match repository conventions while preserving behavior.

### Current Problems (all confirmed)

1. Inline styles throughout (`style="..."` on every element) instead of Tailwind/DS.
2. Direct `$fetch` + manual `useCookie('token')` token handling (lines 112–134).
3. Redundant class fetch: component re-fetches the class that the parent layout (`pages/classes/[_id].vue`) already loads via `classStore.fetch()` at mount.
4. Redundant trainer fetch: `classDoc.general.trainer` is already populated by the backend (`getClass` uses `.populate('general.trainer')`) — no separate trainer request needed.
5. Hardcoded English labels ("About this class", "Schedule", "Details", "Recent Members", "Edit Class").
6. `console.log` (line 118) and `console.error` (line 133).

### Planned Changes

- File: `components/class/ClassOverview.vue`

1. **Replace inline styles** with Tailwind utility classes following DS patterns from sibling components.
2. **Remove redundant class fetch** — consume `classStore.class` (loaded by the layout parent `pages/classes/[_id].vue`, not the immediate `index.vue` page).
3. **Remove trainer fetch** — access `classStore.class.general.trainer` directly; it is already populated as an object.
4. **Keep recent-members fetch** via `useApi()` (not `$fetch` with manual token). This data is not in the store and a local fetch is appropriate.
5. **Remove all `console.log`/`console.error`** calls.
6. **Replace hardcoded labels** with i18n keys. The following new keys are needed:
   - `class.aboutClass` — "About this class"
   - `class.details` — "Details"
   - `class.recentMembers` — "Recent Members"
   - Add these to all three locale files.
   - Existing keys to reuse: `class.schedule` (line 59), `class.editClass` (line 51), `schedule.days.{n}` (lines 164–172).
7. **Replace local `formatDate()`** with `getFormattedDate()` from `utils/formatDate.js` (already used elsewhere).
8. **Replace local `getDayName()`** with `$t('schedule.days.' + session.dayOfWeek)` — this pattern is already used in `components/app/AppClassDetail.vue`.

### Proof / Acceptance

1. Overview tab renders all core information (description, schedule, details panel, recent members).
2. No inline style attributes remain.
3. No direct `$fetch` or `useCookie` in the component.
4. No console output.
5. All visible text goes through `$t()`.
6. Waitlist count is displayed alongside enrollment/capacity _(cross-ref: Task 2 §2.7)_.

---

## Task 4 — AI Feature: Enrollment Insights (Streaming Structured Output)

### Requirements Mapping

1. New API endpoint receives all class and enrollment data from the frontend — no server-side DB fetch (mirrors `generateDescription` pattern).
2. Uses `streamObject()` with a Zod schema.
3. Insight shape: `type`, `message`, `recommendedAction`.
4. Frontend renders insights as they stream in.
5. Panel appears on class members page.

### Backend Plan

- File: `api/routes/ai/_ai.controller.js` — add `enrollmentInsights` method
- File: `api/routes/ai/_ai.router.js` — register new route

**Endpoint:** `POST /api/ai/enrollment-insights` (secret route — requires auth, consistent with existing `/api/ai/generate-description`)

**Request body** (frontend sends all data it already holds in stores — no backend DB fetch needed):
```js
{
  className,       // string — class title
  classType,       // string — e.g. "Yoga"
  trainerName,     // string — populated trainer name
  capacity,        // number — general.capacity
  enrollmentCount, // number
  waitlistCount,   // number
  schedule,        // array of { dayOfWeek, startTime, endTime }
  members,         // array of { status: { confirmation }, enrolledAt } — strip PII
}
```

**Controller logic:**
1. Destructure the above fields from `ctx.request.body`.
2. Build a concise plain-text summary from the received data (no DB calls).
3. Call `streamObject()` with Zod schema:

**Prompt design — security and quality:**
- Keep all dynamic content in the **user turn** (never inject user-controlled strings into the `system` prompt).
- Strip or truncate any field that could carry malicious instructions before interpolation. Do not include raw member names or free-text fields that gym admins or members could have poisoned.
- Keep the prompt concise: a single structured block that states facts and asks for insights. No filler.

Example prompt structure (modelled on `generateDescription`):

```js
system: 'You are a gym operations analyst. Analyze class enrollment data and return 2–5 actionable insights for the gym admin. Be specific, concise, and data-driven. Each insight must have a type (warning/info/suggestion), a one-sentence message, and a short recommended action.',

prompt: `Analyze enrollment for this class and generate insights:
- Class: ${className}
- Type: ${classType || 'General fitness'}
- Trainer: ${trainerName || 'TBD'}
- Schedule: ${scheduleText}
- Capacity: ${enrollmentCount}/${capacity} confirmed${waitlistCount > 0 ? `, ${waitlistCount} waitlisted` : ''}
- Status breakdown: ${confirmedCount} confirmed, ${pendingCount} pending, ${declinedCount} declined

Generate insights. Examples of the kind of insights that are useful:
- "3 members haven't confirmed — consider sending a reminder"
- "This class is at 90% capacity — you may want to open a waitlist"
- "Thursday sessions have lower attendance than Monday sessions"`
```

> Note: `scheduleText` is built server-side from the received `schedule` array using the same day-abbreviation map as `generateDescription`. Numeric counts (`confirmedCount`, `pendingCount`, `declinedCount`) are derived by counting the received `members` array by `status.confirmation` value — never from raw text fields.

4. Call `streamObject()` with Zod schema:

```js
import { streamObject } from 'ai'
import { z } from 'zod'

const schema = z.object({
  insights: z.array(z.object({
    type: z.enum(['warning', 'info', 'suggestion']),
    message: z.string(),
    recommendedAction: z.string(),
  }))
})
```

**Streaming transport:**
- `streamObject()` returns a `partialObjectStream` async iterator that yields successive partial objects as the model builds them up.
- Write each partial object as a JSON line: `ctx.res.write(JSON.stringify(partialObject) + '\n')`.
- This differs from `streamText()` (which writes raw text chunks). Do not copy the `result.textStream` pattern from `generateDescription`.

```js
ctx.respond = false
ctx.res.setHeader('Content-Type', 'text/plain')
ctx.res.setHeader('Cache-Control', 'no-cache')
ctx.res.setHeader('Connection', 'keep-alive')

for await (const partial of result.partialObjectStream) {
  ctx.res.write(JSON.stringify(partial) + '\n')
}
ctx.res.end()
```

Both `ai` (v6.0.121) and `zod` (v3.24.0) are already installed in `api/package.json`.

### Frontend Plan

- New component: `components/ai/AiEnrollmentInsights.vue`
- Integrate in: `pages/classes/[_id]/members.vue`

**Auth pattern:** match `AiDescriptionGenerator.vue` — use `authStore.token` in the `Authorization` header of a `fetch()` call.

**Data assembly:** The component reads from `classStore.class` (already loaded by the layout) and `membersStore.members` (already loaded by `members.vue`). It serializes the needed fields into the request body — no extra store action or API call before triggering generation. Strip any free-text member fields (names, notes) before sending; only send numeric/enum data (`status.confirmation`, `enrolledAt`) to avoid prompt injection via user-controlled strings.

**Stream reading:**
The frontend must parse newline-delimited JSON, not accumulate raw text:

```js
const reader = response.body.getReader()
const decoder = new TextDecoder()
let buffer = ''

while (true) {
  const { done, value } = await reader.read()
  if (done) break
  buffer += decoder.decode(value, { stream: true })
  const lines = buffer.split('\n')
  buffer = lines.pop() // retain any incomplete trailing line
  for (const line of lines) {
    if (!line.trim()) continue
    try {
      const partial = JSON.parse(line)
      if (partial.insights) insights.value = partial.insights
    } catch {}
  }
}
// flush any remaining buffer content after stream ends
if (buffer.trim()) {
  try { const p = JSON.parse(buffer); if (p.insights) insights.value = p.insights } catch {}
}
```

Each JSON line replaces the current `insights` array with the latest (more complete) partial version — insights appear and grow incrementally as the model outputs them. The backend always writes `+ '\n'` per partial, so the buffer flush is a safety net rather than a common path.

**i18n:** All required keys already exist in `en.json` (lines 183–187): `ai.insights`, `ai.generating`, `ai.noInsights`, `ai.getInsights`.

**Component behavior:**
1. "Get Insights" button triggers generation.
2. During generation, insights render progressively as each partial object arrives.
3. Handle error and empty state.

### Proof / Acceptance

1. Insights panel visible on class members page.
2. Insights appear incrementally during generation (not only at stream end).
3. Each rendered insight conforms to `{ type, message, recommendedAction }` shape.
4. Error state handled gracefully.

---

## Test and Verification Plan

### Static Checks

1. Parse/validate touched JSON locale files.
2. Syntax check changed backend/store files.
3. Lint (`yarn lint`) after all changes.

### Functional Checks (Manual)

1. Task 1: Schedule edit shows updated values immediately.
2. Task 2: Waitlist assign on full class (admin and public flows).
3. Task 2: Auto-promotion on confirmed seat release (delete and decline).
4. Task 2: Status filters for pending (`0`) and waitlisted (`2`) both return correct members.
5. Task 2: Waitlist counts visible in class/public UI surfaces.
6. Task 2: Public join waitlist flow and differentiated success messaging.
7. Task 3: Overview tab renders correctly, no inline styles, no console output.
8. Task 4: AI insights stream progressively and handle errors cleanly.

### E2E Test Updates (Required)

The following existing tests must be updated to pass after implementation:

#### `tests/e2e/full-app.spec.js`

**1. Class Detail — overview tab test (line 198–205):**
Current test asserts inline styles exist (`[style*="font-size"]`, etc.) as a "deliberate defect" marker.
Task 3 removes all inline styles → this assertion will fail.
- **Fix:** Replace the inline-style assertion with a check that the overview content renders correctly using Tailwind/DS classes. For example:
  ```js
  test('overview tab renders class information (no inline styles)', async ({ page }) => {
    await page.waitForTimeout(1000)
    // Inline styles should be gone after Task 3 refactor
    const styledElements = page.locator('[style*="font-size"], [style*="color"], [style*="padding"]')
    expect(await styledElements.count()).toBe(0)
    // Core content still renders
    const bodyText = await page.textContent('body')
    expect(bodyText).toMatch(/Schedule|Capacity|Members/i)
  })
  ```

**2. Public App — class detail enroll option (line 393–406):**
Current test checks for either an "Enroll Now" link OR a "Class is full" text div.
Task 2 changes the full-class CTA from a disabled div to an active "Join Waitlist" button/link.
- **Fix:** Update the assertion to accept "Join Waitlist" as a valid CTA alongside "Enroll Now":
  ```js
  const enrollLink = page.locator('a').filter({ hasText: /enroll now/i })
  const waitlistLink = page.locator('a').filter({ hasText: /join waitlist/i })
  const hasEnrollOption = await enrollLink.isVisible().catch(() => false)
    || await waitlistLink.isVisible().catch(() => false)
  expect(hasEnrollOption).toBeTruthy()
  ```

#### `utils/__tests__/formatDate.spec.js`
- No changes required — this test validates utility functions that are not affected by any task.

#### `tests/e2e/loading-spinner.spec.js`
- No changes required — loading spinner behavior is unaffected by these tasks.

---

## Risks and Mitigations

1. **Status `0` filter bug** — fix `!== undefined` check before any waitlist filtering is tested.
2. **Concurrency in promotion logic** — deterministic ordering (`enrolledAt asc`) keeps behavior predictable; acceptable for current load without transactions. Add compound index for query performance _(Gemini)_.
3. **Mixed `pending`/`waitlisted` semantics** — preserve both states intentionally and update backend stats, frontend store, badge component, filters, export function, and i18n in one pass to avoid partial states.
4. **`streamObject` vs `streamText` format difference** — use `partialObjectStream` iterator on backend and newline-delimited JSON parser on frontend; do not copy the raw text-chunk pattern from `AiDescriptionGenerator`.
5. **Prompt injection via user-controlled data** — class titles, trainer names, and any free-text fields are user-supplied and could contain injected instructions. Mitigation: keep dynamic data in the user turn only (never the system prompt), strip or truncate suspicious fields before interpolation, and never include raw member-supplied text (e.g. member names, notes) in the prompt.
6. **Admin confirm-while-full bypass** _(Codex #1)_ — capacity guard must be in `updateMember` (the actual admin UI path), not just `addMember`. Without this, the admin "Confirm" button on `MemberList.vue` would silently confirm over capacity.
7. **State drift between UI defaults and backend capacity logic** — keep add-member/public defaults at `pending` (`0`) and centralize full-capacity conversion to `waitlisted` (`2`) on backend to avoid divergent client behavior.

---

## Deferred Improvements (Do Not Implement Yet)

1. Extract backend status constants (`1`, `0`, `2`, `-1`) to a shared module.
2. Add dedicated integration tests for waitlist promotion and AI insights endpoint.
3. Harden promotion with transaction/session semantics if concurrency load requires it.
4. Analytics/telemetry for waitlist conversions.
5. Include gym branding and locale context in AI enrollment insights prompt for voice consistency _(Gemini recommendation)_.
