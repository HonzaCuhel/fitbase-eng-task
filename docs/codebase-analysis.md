# FitBase Codebase Analysis

This document summarizes the project structure, recurring implementation patterns, and coding conventions used across the repository.

## Scope and Exclusion

- Analyzed: all tracked frontend/backend/source/config/test files in this repository.
- Excluded by request: `components/class/ClassOverview.vue` (and its internals).
- Goal: help a new engineer read the codebase quickly and safely.

## High-Level Architecture

FitBase is a full-stack app split into:

- Frontend: Nuxt 3 + Vue 3 + Pinia + Tailwind CSS + `@attendu/design-system`
- Backend: Koa 3 + Mongoose (MongoDB) + JWT authentication
- AI integrations: Vercel AI SDK + Anthropic
- i18n: `en`, `cs`, `es` with no route prefix strategy
- Tests: Vitest (unit) + Playwright (E2E)

Primary flow:

1. Page/component triggers store action or direct API call.
2. Store/composable calls `useApi()` (or `$fetch` on public app pages).
3. API controller performs Mongoose operations via middleware-injected models.
4. Controller returns data; frontend updates local reactive state and renders.

## Runtime and Build Configuration Conventions

Nuxt runtime conventions in `nuxt.config.js`:

- Inherits shared design primitives via `extends: ['@attendu/design-system']`.
- Core module stack: Pinia, Nuxt ESLint, i18n, Nuxt test-utils module, VueUse.
- Hybrid rendering setup:
  - global `ssr: true`,
  - selective client-side route rules for `/`, `/classes/**`, `/setup/**`, `/app/**`.
- Dev proxy pattern:
  - frontend calls `/api`,
  - Nitro `devProxy` forwards to API server on configured port.
- Public runtime config keys are used for environment wiring (`apiPort`, Sentry DSN, Stripe public key).
- Auto-import conventions:
  - `stores` and `utils` directories auto-imported,
  - `defineStore` explicitly auto-imported from Pinia.
- Vite customization:
  - Tailwind Vite plugin,
  - `dayjs` dedupe/alias handling,
  - optimizeDeps includes DS-related dependencies.
- Compatibility flags are explicitly pinned (`future.compatibilityVersion`, `compatibilityDate`).

Styling pipeline conventions:

- Tailwind is configured through `assets/css/tailwind.css` with custom `@theme` tokens.
- PostCSS injects DS SVG icon path via `postcss-inline-svg`.
- Base layer includes Element Plus loading/inputs integration adjustments.

## Read-This-First Path (Fast Onboarding)

Recommended order:

1. `nuxt.config.js` and `app.vue` for runtime shape and app bootstrap.
2. `layouts/main.vue`, `middleware/auth.global.js`, `stores/auth.js` for navigation/auth flow.
3. Domain cycle:
   - frontend: `pages/classes/*`, `components/class/*`, `stores/classes.js`, `stores/class.js`
   - backend: `api/routes/class/*`, then `api/routes/member/*` for enrollment coupling
4. `api/index.js` + middlewares (`_workspace`, `_models`, `_user`, `_error-handler`) to understand request lifecycle.
5. `tests/e2e/full-app.spec.js` for expected user-visible behavior.

## Repository Structure Conventions

### Frontend

- `pages/`: Nuxt file-based routes, mostly thin orchestration layers.
- `components/<domain>/`: domain UI split by feature (`class`, `member`, `trainer`, etc.).
- `stores/`: Pinia state and async CRUD actions.
- `composables/`: small shared helpers (`useApi`, i18n wrappers, form rules, toast wrapper).
- `layouts/`: global shells for admin, auth, and public member app.
- `locales/`: flat namespaced translation keys by domain.

### Backend

- `api/routes/<domain>/` follows triad naming:
  - `_*.router.js`: route registration
  - `_*.controller.js`: request handlers
  - `_*.schema.js`: Mongoose schema
- `api/middlewares/`: cross-cutting request setup and error normalization.
- `api/services/`: shared infrastructure helpers (currently DB connection helper).
- `api/shared/`: constants.

### Naming Style

- API files use underscore-prefixed filenames (`_class.controller.js`, `_user.router.js`, etc.).
- Frontend files use PascalCase for components and lower camel in stores/composables.
- Admin and public app flows are separated by route namespaces (`/classes/...` vs `/app/[gym]/...`).

### Tooling and Style Conventions

- ESLint style profile is explicit:
  - single quotes,
  - no semicolons,
  - 2-space indentation,
  - trailing commas (multiline),
  - API directory ignored by frontend ESLint config.
- TypeScript config extends Nuxt-generated config and keeps `noUnusedLocals: false`.
- Project uses Yarn scripts in root and API package scripts, but lockfiles are mixed (see gaps).
- `.nuxtrc` pins Nuxt test-utils setup metadata.

## Frontend Patterns and Conventions

### Pages

Common page pattern:

- `definePageMeta({ layout: ... })`
- `useHead({ title: ... })`
- store fetches inside `onMounted`
- render loading state using `v-loading` overlays

Pages usually avoid deep business logic. They:

- compose domain components,
- wire search/filter controls,
- open dialogs/modals,
- trigger store actions.

Routing/auth flow convention:

- Global route middleware (`auth.global.js`) handles admin auth redirects.
- Public admin-auth pages are `login`/`register`.
- Public member app routes (`/app/...`) are intentionally exempted from admin auth middleware.
- On protected-route unauth redirect, previous path is preserved in `sessionStorage` for post-login redirect.

### Components

Strong DS-first composition:

- Form stack: `Form`, `InputBlock`, `TextInput`, `TextArea`, `Select`, `Button`.
- Feedback primitives: `Badge`, `EmptyState`, `StatTile`, modal/dialog wrappers.
- Styling relies on utility classes and shared color tokens.

Composition conventions:

- Small, focused components (`ClassCard`, `TrainerCard`, `MemberStatusBadge`).
- Domain folders align with store/domain naming.
- Props are explicit; emitted events are used for parent orchestration.

Shell composition convention:

- `layouts/main.vue` acts as the admin shell and centralizes:
  - sidebar + header composition,
  - global `Modal`,
  - global `Dialog` driven by `dialogStore`.
- Confirm-style destructive actions generally use `useModalStore()` (from DS ecosystem), while form workflows use `dialogStore.open(...)`.

### State Management (Pinia)

Store conventions:

- One store per domain concern (`classes`, `class`, `members`, `trainers`, `gym`, etc.).
- Async action shape is consistent:
  - set `isLoading`,
  - call API,
  - update store state,
  - show toast on success/failure.
- Filtering/sorting/search update state and often trigger refetch immediately.

Notable pattern split:

- Admin flow mostly uses stores as integration boundary.
- Some pages still call API directly (for example, all-members page).
- Public member app uses `memberApp` store with direct `$fetch` against public endpoints.

### Composables

- `useApi()` centralizes:
  - base URL handling for server/client,
  - Authorization header injection,
  - token refresh workflow,
  - logout on 401.
- `useFormRules()` provides shared validation rule factories.
- `useToast()` wraps DS toast API into project-consistent helpers.
- `composables/i18n.js` exposes convenience wrappers (`useT/useD/useN`).
- `useDebounceFn` (VueUse auto-import) is the standard pattern for client-side search input throttling.

### UX/Loading Convention

- Project standard is spinner overlays (`v-loading`) rather than text placeholders.
- This convention is enforced by E2E tests (`loading-spinner.spec.js` + checks in full app spec).

App bootstrap convention (`app.vue`):

- Wrap app in Element Plus config provider and map locale from i18n locale.
- Restore auth from cookies on mount, fetch user when needed, then fetch gym context for logged-in users.
- Sync Day.js locale whenever UI locale changes.

## Backend Patterns and Conventions

### Request Lifecycle

1. `api/index.js` mounts middleware chain.
2. JWT middleware protects all non-`/api/public/*` routes.
3. `_workspace` resolves workspace from host/query.
4. `_models` injects Mongoose models into `ctx`.
5. `_user` resolves authenticated user context into `ctx.state.user`.
6. Domain controller executes Mongoose operations and returns JSON.

Security/transport middleware convention:

- API stack consistently applies body parser, logger, helmet, and CORS before auth/domain middlewares.
- JWT middleware uses `unless` with `/api/public` route prefix to preserve anonymous endpoints.

### Controllers

Controller style is pragmatic CRUD:

- query parsing in controller (`page`, `limit`, `sortField`, filters),
- direct `ctx.Model.*` calls,
- `ctx.throw(...)` for not-found/validation-style cases,
- try/catch with `ctx.throwError(error)` when needed.

Service abstraction convention:

- Business logic is mostly controller-local.
- Shared helpers are used selectively for reusable domain behavior (`_class.functions.js`) and infrastructure (`_get-database.js`).

### Schemas

Mongoose schemas are:

- nested where it improves domain grouping (`general`, `status`, `settings`, etc.),
- indexed for common filters,
- light on custom validators/business hooks (except password hashing in user schema).

### Auth

- Access token + refresh token pattern.
- Refresh tokens stored on user document (`authTokens.refreshTokens`).
- Frontend token restoration from cookies and refresh-on-expiry behavior in `useApi`.
- Role helper exists (`ctx.state.user.hasRole`) but route-level role enforcement is not broadly applied.

### Public vs Secret Routes

- Public routes under `/api/public/...` (login/register/public class browse/enroll).
- Secret routes under domain prefixes (`/api/classes`, `/api/users`, `/api/trainers`, etc.).
- Router aggregator (`api/_router.js`) mounts each domain’s public and secret router if exported.

## Data Modeling Conventions

- Class document uses nested `general` metadata and separate `schedule` list.
- Enrollment/member status uses numeric confirmation values (`-1`, `0`, `1`).
- Class-level enrollment denormalization exists (`enrollmentCount`) and is updated from member operations.
- Response enrichment pattern exists in class helper (`isFull`, `spotsLeft`).
- Multi-tenant workspace model is DB-level (`connection.useDb(workspace)`), with workspace derived from subdomain by default and query override support.
- Seeder convention exists (`api/seed.js`) and supports workspace argument for isolated sample datasets.

## i18n Conventions

- Translation keys are namespaced by domain (`class.*`, `member.*`, `errors.*`, etc.).
- Locales are largely aligned across `en`, `cs`, `es`.
- Language is selected in header; app also syncs locale from authenticated user when present.
- Strategy is `no_prefix`, so routes are not language-prefixed.

## Testing Conventions

### Unit Tests

- Minimal utility-focused coverage (example: date formatting helpers).
- Vitest runs in Nuxt test environment.

### E2E Tests

- Playwright tests emphasize:
  - auth flow,
  - page-level rendering,
  - DS consistency checks,
  - absence of text-based loading,
  - key CRUD entry points through UI.
- E2E tests also assert design-system usage conventions (avoid native select/confirm patterns on admin UI).

## Additional Repo-Level Conventions

- `.env.example` is the source-of-truth template for required backend environment variables.
- Local/dev operational files exist but are non-runtime for app behavior (`.claude/settings.local.json`, `test-results/.last-run.json`).
- `notes.txt` currently contains env-style data and should not be treated as a safe project config source.

## Known Gaps and Inconsistencies

This section excludes `ClassOverview.vue` on purpose.

1. API validation is inconsistent.
- Most validation is schema-level or ad hoc in controllers.
- `zod` is installed but not broadly used for request payload validation.

2. Error-handling style is mixed.
- Some controller paths use `ctx.throwError`, others rely only on `ctx.throw`.
- This can make response-shape predictability and logging consistency uneven.

3. Data-access boundary is not fully consistent on frontend.
- Most admin features use stores as boundary.
- Some pages/components still call API directly, which fragments data flow conventions.

4. Package manager artifacts are mixed.
- Repository is Yarn-oriented (`yarn.lock`) but includes npm lock artifacts (`package-lock.json` tracking and `api/package-lock.json`).
- This can cause dependency resolution drift across environments.

5. Config drift risk in test tooling.
- Playwright base URL points to port `3000` while Nuxt dev server config uses `3002`.

6. Security hygiene concern in tracked notes file.
- A tracked local notes file contains env-style credential content.
- Sensitive values should be kept out of tracked files and rotated if previously exposed.

7. RBAC is partially scaffolded but not consistently enforced.
- User role helper is available on request context.
- Most secret routes rely on authentication presence rather than role-based authorization checks.

8. Validation strategy is split across layers.
- Mongoose schema validation and ad hoc controller checks coexist.
- A unified request-schema validation layer is not consistently used.

9. Boundary overlap between enrollment/member representations.
- `members` and `enrollments` stores/components model similar backend resources with different local semantics.
- This increases cognitive load and can cause duplicated behavior paths.

10. Some utilities appear underused.
- `useScreen` and `utils/validators.js` have little/no active integration in main feature paths.

11. E2E suite contains coupling to the excluded `ClassOverview` implementation details.
- Tests currently assert overview-specific text/inline-style behavior.
- This can reduce refactor flexibility for that component.

## Practical Conventions Checklist (When Adding Features)

- Put page orchestration in `pages/*`; keep business logic in stores/controllers.
- Reuse DS primitives and `useFormRules()` for forms.
- Use `v-loading` overlays, not plain loading text.
- Keep translation keys under existing domain namespaces across all locales.
- For API changes, follow route-controller-schema structure and maintain public/secret split.
- If adding member/class status logic, update both source records and denormalized counters.
- Prefer a single data-access boundary per feature (ideally store-first in admin flow).
- Preserve Nuxt config conventions: route rules, runtime config usage, and `/api` proxy assumptions.
- Keep admin auth middleware behavior aligned with public member-app route exceptions.

## Summary

The codebase is convention-driven and approachable: clear domain folders, predictable store/controller CRUD patterns, and strong DS usage. The biggest productivity gains for future work are to standardize validation/error boundaries, align package manager artifacts, and keep sensitive local notes out of version control.
