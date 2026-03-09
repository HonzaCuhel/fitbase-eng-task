# FitBase

A full-stack gym management platform built with Nuxt 3 and Koa.

## Stack

- **Frontend:** Nuxt 3, Vue 3, Tailwind CSS 4, Element Plus, Pinia
- **Backend:** Koa 3, MongoDB (Mongoose), JWT auth
- **AI:** Vercel AI SDK with Anthropic Claude (streaming class description generator)
- **i18n:** English, Czech, Spanish
- **Testing:** Vitest, Playwright

## Setup

**Prerequisites:** Node.js >= 22, Yarn, MongoDB instance

### 1. Environment

```bash
cp .env.example .env
```

Fill in your `.env`:

| Variable | Description |
|---|---|
| `API_PORT` | API server port (default: `5051`) |
| `MONGO_DB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret for access tokens |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens |
| `ANTHROPIC_API_KEY` | Anthropic API key (for AI features) |

### 2. API

```bash
cd api
yarn install
node seed.js    # Seed database with sample data
node index.js   # Starts on http://localhost:5051
```

### 3. Frontend

```bash
yarn install
yarn dev        # Starts on http://localhost:3002
```

The frontend proxies `/api` requests to the API server.

### 4. Test login

- **Email:** `admin@fitbase.com`
- **Password:** `password123`

## Scripts

| Command | Description |
|---|---|
| `yarn dev` | Start dev server |
| `yarn build` | Production build |
| `yarn lint` | Run ESLint |
| `yarn lint:fix` | Fix lint issues |
| `yarn test` | Run unit tests (watch) |
| `yarn test:run` | Run unit tests (once) |

## Project Structure

```
├── api/                # Koa backend
│   ├── routes/         # API endpoints (user, gym, class, member, trainer, ai)
│   ├── middlewares/     # Auth, error handling, workspace isolation
│   ├── services/       # Business logic
│   └── seed.js         # Database seeder
├── components/         # Vue components
├── composables/        # Vue composables (API, i18n, forms, toasts)
├── stores/             # Pinia stores
├── pages/              # Nuxt file-based routing
├── locales/            # i18n translation files
└── assets/css/         # Tailwind styles
```

## Key Features

- **Classes** — Create, schedule, publish/archive fitness classes with capacity and trainer assignment
- **Enrollments** — Member registration with confirmation workflow and batch import
- **Members & Trainers** — Full CRUD management
- **Gym Settings** — Branding (color, font), timezone, locale, currency
- **AI Description Generator** — Streaming AI-generated class descriptions via Claude
- **Auth** — JWT-based with access/refresh tokens and role-based access
