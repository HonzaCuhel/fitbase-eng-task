# Review: Tasks Implementation Plan

**Reviewer:** Codex  
**Date:** March 31, 2026  
**Target Document:** `docs/tasks-implementation-plan.md`  
**Base Reference:** `TASKS.md`

## Executive Summary

The plan is strong overall and maps well to the repository structure, but it has two high-impact logic gaps in Task 2 that should be corrected before implementation starts.

## Findings (Ordered by Severity)

### 1) High: Full-capacity guard for manual promotion is mapped to the wrong endpoint

The plan states that "if an admin manually sets a waitlisted member to confirmed while full, reject with `Class is full`" (Decision 5), but places this under `addMember`.

- Plan location: `docs/tasks-implementation-plan.md` lines 19 and 89
- Actual behavior path: `components/member/MemberList.vue` triggers `updateMember` (`PUT /classes/:id/members/:memberId`) when clicking confirm
- API location for this enforcement: `api/routes/member/_member.controller.js` in `updateMember`

Why this matters:
- Without enforcing this in `updateMember`, the rule can be bypassed by the normal admin UI action.

Required correction:
- Move this constraint from the `addMember` section to the `updateMember` section (and keep/add it in `addMember` only if desired for consistency).

### 2) High: Admin "Add Member" default status is not covered by the plan's waitlist semantics

The plan assumes new enrollments are attempted as confirmed and only demoted to waitlisted when full. That is true for public flow after planned changes, but not for admin single-add today.

- Current admin form behavior: `components/member/MemberForm.vue` submits `status.confirmation: 0`
- Plan coverage: does not include this file in Task 2 frontend changes

Why this matters:
- If `0` is now "waitlisted", admin single-add will create waitlisted members even when capacity is available, violating expected enrollment behavior.

Required correction:
- Include `components/member/MemberForm.vue` in Task 2 changes and submit as `confirmation: 1` (or omit status and default to confirmed server-side if that pattern is chosen).

### 3) Medium: Waitlist count visibility scope may miss an important admin surface

Task 2 requires showing waitlist count alongside enrollment count. The plan updates several components, but `ClassOverview.vue` currently has a capacity/enrollment block and is being refactored in Task 3.

- Plan visibility list: `docs/tasks-implementation-plan.md` lines 147-152
- Existing surface with enrollment display: `components/class/ClassOverview.vue`

Why this matters:
- You may satisfy most UI surfaces but still miss one prominent admin detail view.

Recommended correction:
- Explicitly include `ClassOverview.vue` in waitlist count rendering expectations (either in Task 2 list or Task 3 acceptance).

### 4) Medium: `pending -> waitlisted` rename should explicitly include export mapping path

The plan says to rename references in `stores/members.js` but does not call out export mapping lines.

- Relevant area: `stores/members.js` status map and fallback in `formatMembersForExport`

Why this matters:
- Terminology can remain partially inconsistent in CSV export and edge rendering paths.

Recommended correction:
- Explicitly include export status mapping updates in Task 2 frontend checklist.

## Strengths

- Task 1 root-cause analysis and fix strategy are precise and minimal.
- Task 2 correctly identifies the `status=0` filter bug in member query logic.
- Task 3 refactor direction aligns with project patterns (store usage, i18n, DS/Tailwind conventions).
- Task 4 correctly distinguishes structured streaming (`streamObject`) from text streaming and defines a valid frontend parser strategy.

## Final Verdict

Conditionally approved.  
Proceed after addressing Findings 1 and 2, and ideally incorporating Findings 3 and 4 for completeness and consistency.
