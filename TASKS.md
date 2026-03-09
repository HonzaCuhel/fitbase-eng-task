# FitBase — Engineering Tasks

Welcome to the FitBase codebase. This is a fitness class management platform built with Nuxt 3 (Vue 3), Koa.js, MongoDB, and Tailwind CSS.

Before starting, familiarize yourself with the project structure, patterns, and conventions used throughout the codebase.

## Setup

```bash
# Frontend
yarn install
yarn dev

# API (separate terminal)
cd api
yarn install
node seed.js        # Seed the database
node index.js       # Start API server on :5051
```

Login: `admin@fitbase.com` / `password123`

---

## Task 1: Bug Fix

**File:** `stores/class.js`

Users report that when they edit a schedule session (e.g., change the time or room), the UI does not update to reflect the change. They have to refresh the page to see the updated schedule.

Find and fix the bug.

---

## Task 2: Feature — Waitlist

When a class reaches its capacity, new members should be added to a **waitlist** instead of being rejected.

Requirements:
- When a class is full, new enrollments should get a "waitlisted" status
- When a confirmed member is removed or declines, the first waitlisted member should be automatically promoted to "confirmed"
- The UI should show waitlist count alongside enrollment count
- The public enrollment page should indicate when a member is being waitlisted vs. enrolled

Implement this across the full stack (API, stores, components, i18n).

---

## Task 3: Refactor

**File:** `components/class/ClassOverview.vue`

This component works but doesn't follow the patterns and conventions used in the rest of the codebase. Refactor it to align with how other components are written.

---

## Task 4: AI Feature — Enrollment Insights

Build an AI-powered insights panel for the class members page that analyzes enrollment data and provides actionable recommendations.

**Reference:** Look at `components/ai/AiDescriptionGenerator.vue` and `api/routes/ai/_ai.controller.js` to understand how the existing AI feature is implemented (Vercel AI SDK with streaming).

Requirements:
- Create a new API endpoint that receives class and enrollment data
- Use `streamObject()` from the Vercel AI SDK with a Zod schema to return structured insights
- Each insight should have: type (warning/info/suggestion), message, and recommended action
- Create a component that renders insights as they stream in
- Place it on the class members page

Example insights the AI might generate:
- "3 members haven't confirmed — consider sending a reminder"
- "This class is at 90% capacity — you may want to open a waitlist"
- "Thursday sessions have lower attendance than Monday sessions"
