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
for _ in $(seq 1 20); do
  if docker-compose exec -T postgres pg_isready -U checkpoint > /dev/null 2>&1; then
    break
  fi
  sleep 1
done

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
