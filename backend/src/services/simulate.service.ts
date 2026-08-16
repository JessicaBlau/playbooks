import { prisma } from '../db/prisma.js';
import { AppError } from '../middleware/AppError.js';
import { ALLOWED_TRIGGERS, type Action, type Trigger } from '../domain/types.js';
import { matchPlaybooks } from '../domain/matchPlaybooks.js';

export interface SimulationMatch {
  id: string;
  name: string;
  actions: Action[];
}

export interface SimulationResult {
  trigger: Trigger;
  matches: SimulationMatch[];
}

export async function simulateTrigger(userId: string, input: unknown): Promise<SimulationResult> {
  if (typeof input !== 'object' || input === null) {
    throw new AppError(400, 'Request body must be a JSON object');
  }

  const trigger = (input as { trigger: unknown }).trigger;
  if (typeof trigger !== 'string' || !ALLOWED_TRIGGERS.includes(trigger as Trigger)) {
    throw new AppError(400, `trigger must be one of: ${ALLOWED_TRIGGERS.join(', ')}`);
  }

  // Scoped to the caller's own playbooks — simulating across all users would
  // leak other users' playbook names/actions, breaking the ownership boundary
  // already enforced on playbook CRUD. Trigger is filtered here too (not
  // just via matchPlaybooks below) so the DB does the filtering — consistent
  // with the @@index([userId]) precedent of pushing userId-scoped filtering
  // into SQL rather than transferring every row over the wire first.
  const playbooks = await prisma.playbook.findMany({
    where: { userId, trigger: trigger as Trigger },
  });

  // Redundant given the query above already filters by trigger, but kept so
  // this unit-tested pure function stays exercised by real request paths,
  // not just its own test file.
  const matches = matchPlaybooks(
    playbooks.map((p) => ({
      id: p.id,
      name: p.name,
      trigger: p.trigger as Trigger,
      actions: p.actions as Action[],
    })),
    trigger as Trigger
  );

  return {
    trigger: trigger as Trigger,
    matches: matches.map((m) => ({ id: m.id, name: m.name, actions: m.actions })),
  };
}
