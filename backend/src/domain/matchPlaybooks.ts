import type { Action, Trigger } from './types.js';

export interface PlaybookLike {
  id: string;
  name: string;
  trigger: Trigger;
  actions: Action[];
}

export function matchPlaybooks(playbooks: PlaybookLike[], trigger: Trigger): PlaybookLike[] {
  return playbooks.filter((p) => p.trigger === trigger);
}
