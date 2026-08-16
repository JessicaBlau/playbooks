import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { getTestApp } from '../helpers/testApp.js';
import { cleanupUsersByEmail, uniqueEmail } from '../helpers/testDb.js';

const app = getTestApp();
const createdEmails: string[] = [];

async function registerUser(): Promise<{ email: string; token: string }> {
  const email = uniqueEmail('simulate');
  createdEmails.push(email);
  const res = await request(app).post('/auth/register').send({ email, password: 'password123' });
  return { email, token: res.body.token };
}

async function createPlaybook(
  token: string,
  name: string,
  trigger: string,
  actions: string[]
): Promise<void> {
  await request(app)
    .post('/playbooks')
    .set('Authorization', `Bearer ${token}`)
    .send({ name, trigger, actions });
}

afterAll(async () => {
  await cleanupUsersByEmail(...createdEmails);
});

describe('POST /simulateTrigger', () => {
  it('returns matches for playbooks with the given trigger, with correct action lists', async () => {
    const { token } = await registerUser();
    await createPlaybook(token, 'Malware playbook 1', 'MALWARE_DETECTED', ['ISOLATE_HOST']);
    await createPlaybook(token, 'Malware playbook 2', 'MALWARE_DETECTED', [
      'NOTIFY_ADMIN',
      'BLOCK_IP',
    ]);
    await createPlaybook(token, 'Login playbook', 'LOGIN_ATTEMPT', ['NOTIFY_ADMIN']);

    const res = await request(app)
      .post('/simulateTrigger')
      .set('Authorization', `Bearer ${token}`)
      .send({ trigger: 'MALWARE_DETECTED' });

    expect(res.status).toBe(200);
    expect(res.body.trigger).toBe('MALWARE_DETECTED');
    expect(res.body.matches).toHaveLength(2);
    const names = res.body.matches.map((m: { name: string }) => m.name).sort();
    expect(names).toEqual(['Malware playbook 1', 'Malware playbook 2']);
    const p2 = res.body.matches.find((m: { name: string }) => m.name === 'Malware playbook 2');
    expect(p2.actions).toEqual(['NOTIFY_ADMIN', 'BLOCK_IP']);
  });

  it('returns an empty matches array (not an error) when nothing matches', async () => {
    const { token } = await registerUser();
    await createPlaybook(token, 'Login playbook', 'LOGIN_ATTEMPT', ['NOTIFY_ADMIN']);

    const res = await request(app)
      .post('/simulateTrigger')
      .set('Authorization', `Bearer ${token}`)
      .send({ trigger: 'PHISHING_ALERT' });

    expect(res.status).toBe(200);
    expect(res.body.matches).toEqual([]);
  });

  it("scopes matches to the caller's own playbooks, even when another user has a matching trigger", async () => {
    const userA = await registerUser();
    const userB = await registerUser();

    await createPlaybook(userA.token, "A's malware playbook", 'MALWARE_DETECTED', ['ISOLATE_HOST']);
    // userB has no playbooks at all for this trigger.

    const res = await request(app)
      .post('/simulateTrigger')
      .set('Authorization', `Bearer ${userB.token}`)
      .send({ trigger: 'MALWARE_DETECTED' });

    expect(res.status).toBe(200);
    expect(res.body.matches).toEqual([]);
  });

  it('rejects an invalid trigger value with 400', async () => {
    const { token } = await registerUser();
    const res = await request(app)
      .post('/simulateTrigger')
      .set('Authorization', `Bearer ${token}`)
      .send({ trigger: 'NOT_A_TRIGGER' });

    expect(res.status).toBe(400);
  });

  it('rejects a missing trigger with 400, not 500', async () => {
    const { token } = await registerUser();
    const res = await request(app)
      .post('/simulateTrigger')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it('rejects the request without a token with 401', async () => {
    const res = await request(app).post('/simulateTrigger').send({ trigger: 'MALWARE_DETECTED' });
    expect(res.status).toBe(401);
  });

  it('rejects a raw JSON `null` body with 400, not 500', async () => {
    const { token } = await registerUser();
    const res = await request(app)
      .post('/simulateTrigger')
      .set('Authorization', `Bearer ${token}`)
      .type('json')
      .send('null');

    expect(res.status).toBe(400);
    expect(res.body.error).toEqual(expect.any(String));
  });
});
