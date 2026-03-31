# FitBase Project Overview

FitBase is a full-stack gym management platform designed to handle classes, enrollments, members, trainers, and gym settings. It features an AI-driven class description generator and supports multiple languages.

## Tech Stack

- **Frontend:** Nuxt 3, Vue 3, Tailwind CSS 4, Element Plus, Pinia
- **Backend:** Koa 3, MongoDB (Mongoose), JWT authentication
- **AI:** Vercel AI SDK with Anthropic Claude (streaming support)
- **Design System:** `@attendu/design-system`
- **Testing:** Vitest (unit/component), Playwright (E2E)
- **i18n:** English (en), Czech (cs), Spanish (es)

## Architecture & Structure

The repository is split into a frontend (root) and a backend (`api/` directory).

### Frontend (root)
- `pages/`: Nuxt file-based routing.
- `components/`: Domain-specific UI components (e.g., `class/`, `member/`).
- `stores/`: Pinia state management (one store per domain concern).
- `composables/`: Shared logic (e.g., `useApi`, `useAppI18n`, `useFormRules`).
- `locales/`: i18n translation files.
- `middleware/`: Global auth guards (`auth.global.js`).

### Backend (`api/`)
- `routes/`: Domain-organized endpoints following a controller-router-schema pattern.
- `middlewares/`: Cross-cutting concerns (auth, error handling, workspace isolation, model injection).
- `seed.js`: Database seeder for sample data.
- `index.js`: API server entry point (Koa stack).

## Building and Running

### Prerequisites
- Node.js >= 22
- Yarn
- MongoDB instance

### Environment Setup
1. Copy `.env.example` to `.env` in the root and fill in the required variables (`API_PORT`, `MONGO_DB_URI`, `JWT_SECRET`, `ANTHROPIC_API_KEY`).

### Running the Project
- **Backend:**
  ```bash
  cd api
  yarn install
  node seed.js    # Seed database
  node index.js   # Start API on http://localhost:5051
  ```
- **Frontend:**
  ```bash
  yarn install
  yarn dev        # Start dev server on http://localhost:3002
  ```

### Testing
- **Unit/Component:** `yarn test` or `yarn test:run`
- **E2E:** `npx playwright test` (ensure dev server is running)

## Development Conventions

### Coding Style
- **Linter:** ESLint (single quotes, no semicolons, 2-space indentation).
- **Backend:** Uses underscore-prefixed filenames (e.g., `_class.controller.js`).
- **Frontend:** PascalCase for components, camelCase for stores/composables.

### Patterns
- **API Calls:** Always use the `useApi()` composable for authenticated endpoints to ensure JWT handling and automatic token refresh.
- **Modals/Dialogs:** Managed via `stores/dialog.js`. Use `dialogStore.open('ComponentName', props)`.
- **i18n:** Use `useAppI18n()` wrapper instead of raw `useI18n()`.
- **State:** Stores should own collection state, pagination, and filters.
- **UX:** Prefer spinner overlays (`v-loading`) for loading states instead of plain text placeholders.

### Security
- Admin routes are protected by `middleware/auth.global.js`.
- Public routes (login, register, public member app) skip JWT authentication.
- Workspace isolation is handled via `subdomain` or `workspace` query parameter.
