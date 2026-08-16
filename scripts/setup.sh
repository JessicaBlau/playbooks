#!/usr/bin/env bash
# One-command local setup: env files, Postgres, install, migrate, seed.
# Safe to re-run — every step is idempotent.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "==> Checking Docker"
if ! docker info > /dev/null 2>&1; then
  echo "Docker doesn't seem to be running. Start Docker Desktop and re-run this script." >&2
  exit 1
fi

echo "==> Starting Postgres (docker-compose)"
docker-compose up -d

echo "==> Setting up env files"
if [ ! -f backend/.env ]; then
  cp backend/.env.example backend/.env
  echo "Created backend/.env — edit JWT_SECRET before deploying anywhere real."
else
  echo "backend/.env already exists, leaving it alone."
fi

if [ ! -f frontend/.env ]; then
  cp frontend/.env.example frontend/.env
  echo "Created frontend/.env"
else
  echo "frontend/.env already exists, leaving it alone."
fi

echo "==> Installing dependencies"
npm install

echo "==> Waiting for Postgres to accept connections"
# Waits on the container's own healthcheck (docker-compose.yml), not a
# hand-rolled pg_isready loop here — the postgres image briefly runs a
# temporary Unix-socket-only instance during initdb before the real,
# TCP-listening server starts, and a plain unqualified pg_isready check
# can't tell the two apart. The healthcheck already forces a TCP check.
for _ in $(seq 1 30); do
  status=$(docker inspect --format='{{.State.Health.Status}}' "$(docker-compose ps -q postgres)" 2>/dev/null || echo "unknown")
  if [ "$status" = "healthy" ]; then
    break
  fi
  sleep 1
done
if [ "$status" != "healthy" ]; then
  echo "Postgres did not become healthy in time. Check 'docker-compose logs postgres'." >&2
  exit 1
fi

echo "==> Generating Prisma Client"
(cd backend && npx prisma generate)

echo "==> Applying database migrations"
(cd backend && npx prisma migrate deploy)

echo "==> Seeding demo data"
(cd backend && npx prisma db seed)

cat <<'EOF'

Setup complete.

Demo login:
  email:    demo@example.com
  password: demo12345

Next steps (two terminals):
  npm run dev:backend    # http://localhost:4010
  npm run dev:frontend   # http://localhost:5173
EOF
