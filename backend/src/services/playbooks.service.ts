import { prisma } from '../db/prisma.js';
import { AppError } from '../middleware/AppError.js';
import { validatePlaybookInput } from '../domain/validatePlaybookInput.js';
import type { Action, Trigger } from '../domain/types.js';

export interface PlaybookDTO {
  id: string;
  name: string;
  trigger: Trigger;
  actions: Action[];
  createdAt: string;
}

function toDTO(playbook: {
  id: string;
  name: string;
  trigger: string;
  actions: string[];
  createdAt: Date;
}): PlaybookDTO {
  return {
    id: playbook.id,
    name: playbook.name,
    trigger: playbook.trigger as Trigger,
    actions: playbook.actions as Action[],
    createdAt: playbook.createdAt.toISOString(),
  };
}

export async function listPlaybooks(userId: string): Promise<PlaybookDTO[]> {
  const playbooks = await prisma.playbook.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
  return playbooks.map(toDTO);
}

export async function createPlaybook(userId: string, input: unknown): Promise<PlaybookDTO> {
  if (typeof input !== 'object' || input === null) {
    throw new AppError(400, 'Request body must be a JSON object');
  }

  const body = input as { name: unknown; trigger: unknown; actions: unknown };
  const validation = validatePlaybookInput(body);
  if (!validation.valid) {
    throw new AppError(400, validation.errors.join('; '));
  }

  const playbook = await prisma.playbook.create({
    data: {
      name: (body.name as string).trim(),
      trigger: body.trigger as Trigger,
      actions: body.actions as Action[],
      userId,
    },
  });

  return toDTO(playbook);
}

export async function deletePlaybook(userId: string, playbookId: string): Promise<void> {
  const result = await prisma.playbook.deleteMany({ where: { id: playbookId, userId } });
  if (result.count === 0) {
    throw new AppError(404, 'Playbook not found');
  }
}
