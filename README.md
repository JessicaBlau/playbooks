# Security Automation Playbook Builder

[![CI](https://github.com/JessicaBlau/playbooks/actions/workflows/ci.yml/badge.svg)](https://github.com/JessicaBlau/playbooks/actions/workflows/ci.yml)

A minimal web app for creating and simulating security automation playbooks. Users register/log in, create playbooks (a trigger + 1-3 actions), and simulate a trigger event to see which of their playbooks would fire and what actions would run.

## Stack

- **Backend:** Node.js + TypeScript + Express, PostgreSQL via [Prisma](https://www.prisma.io/), JWT auth (`jsonwebtoken` + `bcrypt`), request validation with `zod`.
- **Frontend:** React + TypeScript via Vite, `react-router-dom`, plain `fetch`-based API client (no extra data-fetching library needed at this scope).
- **Tests:** Vitest (+ Supertest for backend HTTP tests, React Testing Library for frontend component tests).

Chosen because this is a small, well-defined REST CRUD app — Express keeps the API layer simple, Prisma gives a typed, migration-backed data layer with almost no boilerplate (including native Postgres enums/arrays for `Trigger`/`Action`), and JWT is exactly the "basic token system" the assignment asks for.

## Prerequisites

- Node.js 20+
- Docker (for local Postgres) — or point `DATABASE_URL` at any Postgres instance you already have running.

## Setup

### Fastest path

```bash
npm run setup
```

This starts Postgres (Docker), creates `.env` files from the `.env.example` templates (only if they don't already exist), installs dependencies, applies migrations, and seeds a demo account. Safe to re-run at any time. It prints the demo login when it finishes.

### Step by step (or if `npm run setup` doesn't work in your environment)

1. **Install dependencies** (from the repo root — this is an npm workspace):

   ```bash
   npm install
   ```

2. **Start Postgres:**

   ```bash
   docker-compose up -d
   ```

3. **Configure environment variables:**

   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

   Edit `backend/.env` and set a real `JWT_SECRET` (any long random string). The default `DATABASE_URL` matches the `docker-compose.yml` Postgres service, so it works as-is if you used step 2. `FRONTEND_ORIGIN` controls which origin the API accepts CORS requests from (defaults to `http://localhost:5173`, matching Vite's default dev port) — update it if you run the frontend somewhere else.

4. **Run database migrations:**

   ```bash
   cd backend && npx prisma migrate deploy
   ```

5. **(Optional) Seed a demo account:**

   ```bash
   cd backend && npx prisma db seed
   ```

## Running the app

In two terminals, from the repo root:

```bash
npm run dev:backend   # http://localhost:4010
npm run dev:frontend  # http://localhost:5173
```

Open http://localhost:5173 and either register a new account or log in with the seeded demo account (`demo@example.com` / `demo12345`, if you ran the seed step), then create a playbook and try "Simulate Event" to see matching playbooks and the actions they'd run.

## Running tests

```bash
npm run test:backend   # unit tests + Supertest integration tests (requires Postgres running + migrated)
npm run test:frontend  # component tests
```

CI (`.github/workflows/ci.yml`) runs both suites, plus both typechecks and the frontend production build, against a real Postgres service container on every push and PR.

## API

All bodies/responses are JSON. Protected routes require `Authorization: Bearer <token>`.

| Method | Path                | Auth | Description                                      |
| ------ | ------------------- | ---- | ------------------------------------------------- |
| POST   | `/auth/register`    | No   | Create a user, returns a token                    |
| POST   | `/auth/login`       | No   | Log in, returns a token                            |
| GET    | `/playbooks`        | Yes  | List the current user's playbooks                  |
| POST   | `/playbooks`        | Yes  | Create a playbook (1 trigger, 1-3 actions)          |
| DELETE | `/playbooks/:id`    | Yes  | Delete a playbook you own                           |
| POST   | `/simulateTrigger`  | Yes  | Given a trigger, return matching playbooks + actions |

Triggers: `MALWARE_DETECTED`, `LOGIN_ATTEMPT`, `PHISHING_ALERT`.
Actions: `ISOLATE_HOST`, `NOTIFY_ADMIN`, `BLOCK_IP`.

## Notes / scope

- Editing playbooks is intentionally not implemented (marked optional in the assignment brief).
- Actions/triggers are fixed to the sets above; there's no admin UI to add new ones.
- `/simulateTrigger` is scoped to the calling user's own playbooks, consistent with playbook CRUD ownership.

## Engineering decisions

Short version of the trade-offs behind the stack and structure choices, for anyone reviewing the code:

- **Express over Nest/Fastify.** Four endpoint groups and no dependency-injection or plugin-ecosystem needs — a framework with more ceremony would add ramp-up cost without buying anything here.
- **Prisma + Postgres over a raw driver or another ORM.** Typed models and migrations for very little boilerplate, and Postgres's native enum and array column types map directly onto the fixed `Trigger`/`Action` sets — no join table needed for "1-3 actions."
- **JWT over sessions.** The brief asks for "a basic token system"; JWT means no server-side session store, and `requireAuth` middleware is a single stateless check (`jwt.verify`) rather than a DB round-trip per request.
- **REST over GraphQL.** The brief allows either, but the API surface is 4 flat resources with no nested/aggregated queries a GraphQL layer would meaningfully simplify — it would only add a schema and resolver layer over the same logic.
- **npm workspaces over a monorepo tool (Turborepo/Nx).** Two packages, no shared build pipeline complexity to manage — workspaces alone cover everything needed (single install, per-package scripts).
- **No shared `packages/shared` for the `Trigger`/`Action` types.** They're duplicated (with a comment pointing each copy at its pair) between `backend/src/domain/types.ts` and `frontend/src/types/domain.ts` rather than factored into a shared package — at two files, the coordination overhead of a shared workspace package would cost more than the duplication does.
- **Ownership scoping enforced at the query level, not post-fetch filtering.** Every read/write (`listPlaybooks`, `deletePlaybook`, `simulateTrigger`) filters by `userId` in the Prisma `where` clause itself, so there's no code path that fetches another user's row into memory before checking ownership.
- **`deletePlaybook` uses one atomic `deleteMany({ where: { id, userId } })`** rather than a `findUnique` + `delete` pair, closing a TOCTOU gap between the ownership check and the delete.
- **CORS restricted to `FRONTEND_ORIGIN`, not left wide open.** Not strictly required — the JWT-in-header (not cookie) auth model means there's no CSRF vector either way — but it's a one-line hardening with no functional cost.
- **What's deliberately not here:** editing playbooks (marked optional in the brief), rate limiting, refresh tokens/logout endpoint, and email verification. All would be reasonable in a real product; none are asked for, and adding them would be scope creep against a "0.5–1 day" exercise.
