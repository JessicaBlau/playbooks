import { createApp } from '../../src/app.js';

// Fresh Express app instance per import; createApp() has no per-call side
// effects (routers/middleware are stateless), so integration test files can
// each call this once at module scope.
export function getTestApp() {
  return createApp();
}
