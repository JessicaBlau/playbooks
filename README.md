# Security Automation Playbook Builder

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
   cd backend && npx prisma migrate dev --name init
   ```

## Running the app

In two terminals, from the repo root:

```bash
npm run dev:backend   # http://localhost:4010
npm run dev:frontend  # http://localhost:5173
```

Open http://localhost:5173, register a user, create a playbook, then go to "Simulate Event" and pick a trigger to see matching playbooks and the actions they'd run.

## Running tests

```bash
npm run test:backend   # unit tests + Supertest integration tests (requires Postgres running + migrated)
npm run test:frontend  # component tests
```

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
