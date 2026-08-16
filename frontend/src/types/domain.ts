export type Trigger = 'MALWARE_DETECTED' | 'LOGIN_ATTEMPT' | 'PHISHING_ALERT';
export type Action = 'ISOLATE_HOST' | 'NOTIFY_ADMIN' | 'BLOCK_IP';

// Mirrored in backend/src/domain/types.ts — no shared package at this scope.
export const ALLOWED_TRIGGERS: Trigger[] = ['MALWARE_DETECTED', 'LOGIN_ATTEMPT', 'PHISHING_ALERT'];
export const ALLOWED_ACTIONS: Action[] = ['ISOLATE_HOST', 'NOTIFY_ADMIN', 'BLOCK_IP'];

export const TRIGGER_LABELS: Record<Trigger, string> = {
  MALWARE_DETECTED: 'Malware Detected',
  LOGIN_ATTEMPT: 'Login Attempt',
  PHISHING_ALERT: 'Phishing Alert',
};

export const ACTION_LABELS: Record<Action, string> = {
  ISOLATE_HOST: 'Isolate Host',
  NOTIFY_ADMIN: 'Notify Admin',
  BLOCK_IP: 'Block IP',
};

export interface Playbook {
  id: string;
  name: string;
  trigger: Trigger;
  actions: Action[];
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
}
