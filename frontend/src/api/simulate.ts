import { apiRequest } from './client';
import type { Action, Trigger } from '../types/domain';

export interface SimulationMatch {
  id: string;
  name: string;
  actions: Action[];
}

export interface SimulationResult {
  trigger: Trigger;
  matches: SimulationMatch[];
}

export function simulateTrigger(trigger: Trigger): Promise<SimulationResult> {
  return apiRequest<SimulationResult>('/simulateTrigger', {
    method: 'POST',
    auth: true,
    body: { trigger },
  });
}
