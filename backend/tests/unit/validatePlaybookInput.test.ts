import { describe, it, expect } from 'vitest';
import { validatePlaybookInput } from '../../src/domain/validatePlaybookInput.js';

const validInput = {
  name: 'Contain malware',
  trigger: 'MALWARE_DETECTED',
  actions: ['ISOLATE_HOST', 'NOTIFY_ADMIN'],
};

describe('validatePlaybookInput', () => {
  it('accepts a valid input', () => {
    const result = validatePlaybookInput(validInput);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('rejects an empty name', () => {
    const result = validatePlaybookInput({ ...validInput, name: '' });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => /non-empty string/.test(e))).toBe(true);
  });

  it('rejects a whitespace-only name', () => {
    const result = validatePlaybookInput({ ...validInput, name: '   ' });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => /non-empty string/.test(e))).toBe(true);
  });

  it('rejects a name over 100 characters', () => {
    const result = validatePlaybookInput({ ...validInput, name: 'a'.repeat(101) });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => /100 characters/.test(e))).toBe(true);
  });

  it('accepts a name of exactly 100 characters', () => {
    const result = validatePlaybookInput({ ...validInput, name: 'a'.repeat(100) });
    expect(result.valid).toBe(true);
  });

  it('rejects zero actions', () => {
    const result = validatePlaybookInput({ ...validInput, actions: [] });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => /at least 1 action/.test(e))).toBe(true);
  });

  it('rejects more than 3 actions', () => {
    const result = validatePlaybookInput({
      ...validInput,
      actions: ['ISOLATE_HOST', 'NOTIFY_ADMIN', 'BLOCK_IP', 'ISOLATE_HOST'],
    });
    expect(result.valid).toBe(false);
    // 4 items also trips the duplicate check since ISOLATE_HOST repeats;
    // use a distinct-but-too-long case to isolate the "at most 3" message.
    expect(result.errors.some((e) => /at most 3 actions/.test(e))).toBe(true);
  });

  it('accepts exactly 3 distinct actions', () => {
    const result = validatePlaybookInput({
      ...validInput,
      actions: ['ISOLATE_HOST', 'NOTIFY_ADMIN', 'BLOCK_IP'],
    });
    expect(result.valid).toBe(true);
  });

  it('rejects an invalid trigger value', () => {
    const result = validatePlaybookInput({ ...validInput, trigger: 'NOT_A_TRIGGER' });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => /trigger must be one of/.test(e))).toBe(true);
  });

  it('rejects an invalid action value', () => {
    const result = validatePlaybookInput({ ...validInput, actions: ['NOT_AN_ACTION'] });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => /actions must be one of/.test(e))).toBe(true);
  });

  it('rejects duplicate actions', () => {
    const result = validatePlaybookInput({
      ...validInput,
      actions: ['ISOLATE_HOST', 'ISOLATE_HOST'],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => /duplicates/.test(e))).toBe(true);
  });

  it('rejects a non-array actions field', () => {
    const result = validatePlaybookInput({ ...validInput, actions: 'ISOLATE_HOST' });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => /actions must be an array/.test(e))).toBe(true);
  });

  it('accumulates multiple errors at once', () => {
    const result = validatePlaybookInput({ name: '', trigger: 'BAD', actions: [] });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(3);
  });
});
