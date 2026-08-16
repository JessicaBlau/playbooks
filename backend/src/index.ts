import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Explicit .env loading — previously this only worked as a side effect of
// @prisma/client's own .env loading on import (before this file's env
// checks ran, due to ESM import hoisting putting a static `import
// './app.js'` — and everything it transitively imports, including
// @prisma/client — ahead of any code in this file's body). That was
// undocumented and would silently break on a Prisma major upgrade or if
// Prisma were ever swapped out. Mirrors the guarded-load precedent already
// used in tests/helpers/setupEnv.ts. Only loads if present: deployed
// environments (CI, hosting platforms) inject env vars directly with no
// .env file.
//
// `./app.js` is imported dynamically, after this runs, specifically so this
// load genuinely happens first — a static import here would be hoisted
// above it by the module loader regardless of source order, silently
// reintroducing the exact ordering bug this fixes.
const envPath = fileURLToPath(new URL('../.env', import.meta.url));
if (existsSync(envPath)) {
  process.loadEnvFile(envPath);
}

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set');
}

const { createApp } = await import('./app.js');

const port = process.env.PORT ? Number(process.env.PORT) : 4010;

const app = createApp();

app.listen(port, () => {
  console.log(`checkpoint backend listening on port ${port}`);
});
