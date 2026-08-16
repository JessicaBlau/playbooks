import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Vitest setup file: loads backend/.env before any test module (including
// src/db/prisma.ts and src/utils/jwt.ts, which read process.env at call time)
// runs. Neither `tsx` nor `vitest` auto-load .env files in this project, so
// without this, DATABASE_URL/JWT_SECRET would be undefined for integration
// tests. Uses Node's built-in loader (available since Node 20.6) rather than
// adding a `dotenv` dependency just for tests.
//
// Only loads if the file exists: CI (and other environments that inject
// DATABASE_URL/JWT_SECRET directly) has no .env file on disk, and
// process.loadEnvFile throws ENOENT rather than no-op-ing on a missing path.
const envPath = fileURLToPath(new URL('../../.env', import.meta.url));
if (existsSync(envPath)) {
  process.loadEnvFile(envPath);
}
