import { ALLOWED_ACTIONS, ALLOWED_TRIGGERS, type Action, type Trigger } from './types.js';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validatePlaybookInput(input: {
  name: unknown;
  trigger: unknown;
  actions: unknown;
}): ValidationResult {
  const errors: string[] = [];

  if (typeof input.name !== 'string' || input.name.trim().length === 0) {
    errors.push('name must be a non-empty string');
  } else if (input.name.length > 100) {
    errors.push('name must be 100 characters or fewer');
  }

  if (typeof input.trigger !== 'string' || !ALLOWED_TRIGGERS.includes(input.trigger as Trigger)) {
    errors.push(`trigger must be one of: ${ALLOWED_TRIGGERS.join(', ')}`);
  }

  if (!Array.isArray(input.actions)) {
    errors.push('actions must be an array');
  } else {
    if (input.actions.length === 0) {
      errors.push('at least 1 action is required');
    } else if (input.actions.length > 3) {
      errors.push('at most 3 actions are allowed');
    }
    const invalid = input.actions.filter(
      (a) => typeof a !== 'string' || !ALLOWED_ACTIONS.includes(a as Action)
    );
    if (invalid.length > 0) {
      errors.push(`actions must be one of: ${ALLOWED_ACTIONS.join(', ')}`);
    }
    const unique = new Set(input.actions);
    if (unique.size !== input.actions.length) {
      errors.push('actions must not contain duplicates');
    }
  }

  return { valid: errors.length === 0, errors };
}
