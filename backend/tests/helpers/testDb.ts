import { prisma } from '../../src/db/prisma.js';

// Test-data hygiene helpers. Tests run against a real, shared Postgres
// instance with no reset between runs, so every integration test must clean
// up exactly the rows it created (scoped by the unique emails/ids it used) —
// never a blanket truncate, which would race with anything else touching
// the same DB.

/**
 * Deletes users (and, via onDelete: Cascade in the schema, their playbooks)
 * for the given emails. Safe to call even if some/all were never created or
 * already deleted.
 */
export async function cleanupUsersByEmail(...emails: string[]): Promise<void> {
  await prisma.user.deleteMany({ where: { email: { in: emails } } });
}

export function uniqueEmail(prefix = 'test'): string {
  return `${prefix}-${crypto.randomUUID()}@example.com`;
}
