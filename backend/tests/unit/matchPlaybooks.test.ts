import { describe, it, expect } from 'vitest';
import { matchPlaybooks, type PlaybookLike } from '../../src/domain/matchPlaybooks.js';

const playbooks: PlaybookLike[] = [
  { id: '1', name: 'Malware A', trigger: 'MALWARE_DETECTED', actions: ['ISOLATE_HOST'] },
  { id: '2', name: 'Login B', trigger: 'LOGIN_ATTEMPT', actions: ['NOTIFY_ADMIN'] },
  {
    id: '3',
    name: 'Malware C',
    trigger: 'MALWARE_DETECTED',
    actions: ['NOTIFY_ADMIN', 'BLOCK_IP'],
  },
  { id: '4', name: 'Phishing D', trigger: 'PHISHING_ALERT', actions: ['BLOCK_IP'] },
];

describe('matchPlaybooks', () => {
  it('returns only playbooks matching the given trigger, preserving their action lists', () => {
    const result = matchPlaybooks(playbooks, 'MALWARE_DETECTED');
    expect(result.map((p) => p.id)).toEqual(['1', '3']);
    expect(result.find((p) => p.id === '3')?.actions).toEqual(['NOTIFY_ADMIN', 'BLOCK_IP']);
  });

  it('returns a single match when only one playbook has that trigger', () => {
    const result = matchPlaybooks(playbooks, 'LOGIN_ATTEMPT');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('2');
  });

  it('returns an empty array when no playbooks match the trigger', () => {
    const result = matchPlaybooks(
      playbooks.filter((p) => p.trigger !== 'PHISHING_ALERT'),
      'PHISHING_ALERT'
    );
    expect(result).toEqual([]);
  });

  it('returns an empty array when given an empty list (e.g. after ownership filtering)', () => {
    const result = matchPlaybooks([], 'MALWARE_DETECTED');
    expect(result).toEqual([]);
  });

  it('does not mutate the input array', () => {
    const copy = [...playbooks];
    matchPlaybooks(playbooks, 'MALWARE_DETECTED');
    expect(playbooks).toEqual(copy);
  });
});
