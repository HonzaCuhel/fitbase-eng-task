# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FitBase is a full-stack gym management platform. Frontend is Nuxt 3 + Vue 3 with Pinia, Element Plus, Tailwind CSS 4, and `@attendu/design-system`. Backend is Koa 3 with MongoDB/Mongoose and JWT auth. AI features use Vercel AI SDK + Anthropic Claude for streaming responses.

## Commands

### Frontend (root)
```bash
yarn dev          # Dev server on :3002
yarn build        # Production build
yarn lint         # ESLint check
yarn lint:fix     # Auto-fix lint issues
yarn test         # Vitest watch mode
yarn test:run     # Vitest single run
```

### Backend (api/)
```bash
cd api && node seed.js    # Seed MongoDB with test data
cd api && node index.js   # Start API on :5051
```

Test login: `admin@fitbase.com` / `password123`

### Running a single test
```bash
yarn test utils/__tests__/formatDate.spec.js
```

## Architecture

### Routing & Rendering
- Admin routes (`/`, `/classes/**`, `/members`, `/trainers`, `/settings`) — SSR disabled, auth required
- Auth routes (`/login`, `/register`) — SSR enabled, redirects if logged in
- Public member app (`/app/[gym]/**`) — SSR disabled, no auth
- `middleware/auth.global.js` guards all routes

### State & Data Flow
- **Pinia stores** (`stores/`) own collection state, pagination, and filters
- **`composables/useApi.js`** handles all HTTP with automatic JWT token refresh
- Components call store actions on mount and bind to reactive state
- API dev proxy: frontend `/api/*` → backend `:5051` (configured in `nuxt.config.js`)

### Backend Structure
Koa middleware stack order: ErrorHandler → BodyParser → Logger → Helmet → CORS → JWT Auth → Workspace isolation → Models injection → User context → Router

Routes are organized by domain under `api/routes/` (class, member, trainer, gym, user, ai). Public endpoints are under `/api/public/*` and skip JWT auth.

### Key Patterns
- All authenticated API calls use `useApi()` composable — never use `$fetch` directly for protected endpoints
- Modals/dialogs managed via `stores/dialog.js` — open with `dialogStore.open('ComponentName', props)`
- i18n via `composables/i18n.js` wrapper — use `useAppI18n()` not raw `useI18n()`
- Element Plus forms use `useFormRules.js` for shared validation rules

## Code Style
ESLint enforces: single quotes, no semicolons, 2-space indent. The `api/` directory is excluded from ESLint.

## Engineering Tasks
Active tasks are in `TASKS.md`. Implementation guidance is in `docs/tasks-implementation-plan.md`.
