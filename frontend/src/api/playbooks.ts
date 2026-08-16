import { apiRequest } from './client';
import type { Action, Playbook, Trigger } from '../types/domain';

export function listPlaybooks(): Promise<{ playbooks: Playbook[] }> {
  return apiRequest<{ playbooks: Playbook[] }>('/playbooks', { auth: true });
}

export function createPlaybook(
  name: string,
  trigger: Trigger,
  actions: Action[]
): Promise<{ playbook: Playbook }> {
  return apiRequest<{ playbook: Playbook }>('/playbooks', {
    method: 'POST',
    auth: true,
    body: { name, trigger, actions },
  });
}

export function deletePlaybook(id: string): Promise<void> {
  return apiRequest<void>(`/playbooks/${id}`, { method: 'DELETE', auth: true });
}
