export type Trigger = 'MALWARE_DETECTED' | 'LOGIN_ATTEMPT' | 'PHISHING_ALERT';
export type Action = 'ISOLATE_HOST' | 'NOTIFY_ADMIN' | 'BLOCK_IP';

// Mirrored in frontend/src/types/domain.ts — no shared package at this scope.
export const ALLOWED_TRIGGERS: Trigger[] = ['MALWARE_DETECTED', 'LOGIN_ATTEMPT', 'PHISHING_ALERT'];
export const ALLOWED_ACTIONS: Action[] = ['ISOLATE_HOST', 'NOTIFY_ADMIN', 'BLOCK_IP'];

export interface PlaybookInput {
  name: string;
  trigger: Trigger;
  actions: Action[];
}
