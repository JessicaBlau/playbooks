import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { getTestApp } from '../helpers/testApp.js';
import { cleanupUsersByEmail, uniqueEmail } from '../helpers/testDb.js';

const app = getTestApp();
const createdEmails: string[] = [];

async function registerUser(): Promise<{ email: string; token: string; userId: string }> {
  const email = uniqueEmail('playbooks');
  createdEmails.push(email);
  const res = await request(app)
    .post('/auth/register')
    .send({ email, password: 'password123' });
  return { email, token: res.body.token, userId: res.body.user.id };
}

afterAll(async () => {
  await cleanupUsersByEmail(...createdEmails);
});

describe('POST /playbooks', () => {
  it('creates a playbook with 1 trigger + 1-3 actions and returns 201', async () => {
    const { token } = await registerUser();
    const res = await request(app)
      .post('/playbooks')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Contain malware', trigger: 'MALWARE_DETECTED', actions: ['ISOLATE_HOST'] });

    expect(res.status).toBe(201);
    expect(res.body.playbook).toMatchObject({
      name: 'Contain malware',
      trigger: 'MALWARE_DETECTED',
      actions: ['ISOLATE_HOST'],
    });
    expect(res.body.playbook.id).toEqual(expect.any(String));
  });

  it('rejects a playbook with 0 actions with 400, not 500', async () => {
    const { token } = await registerUser();
    const res = await request(app)
      .post('/playbooks')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'No actions', trigger: 'MALWARE_DETECTED', actions: [] });

    expect(res.status).toBe(400);
    expect(res.body.error).toEqual(expect.any(String));
  });

  it('rejects a playbook with more than 3 actions with 400', async () => {
    const { token } = await registerUser();
    const res = await request(app)
      .post('/playbooks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Too many actions',
        trigger: 'MALWARE_DETECTED',
        actions: ['ISOLATE_HOST', 'NOTIFY_ADMIN', 'BLOCK_IP', 'ISOLATE_HOST'],
      });

    expect(res.status).toBe(400);
  });

  it('rejects an invalid trigger with 400', async () => {
    const { token } = await registerUser();
    const res = await request(app)
      .post('/playbooks')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Bad trigger', trigger: 'NOT_A_TRIGGER', actions: ['ISOLATE_HOST'] });

    expect(res.status).toBe(400);
  });

  it('rejects the request without a token with 401', async () => {
    const res = await request(app)
      .post('/playbooks')
      .send({ name: 'No auth', trigger: 'MALWARE_DETECTED', actions: ['ISOLATE_HOST'] });

    expect(res.status).toBe(401);
  });

  it('rejects the request with an invalid token with 401', async () => {
    const res = await request(app)
      .post('/playbooks')
      .set('Authorization', 'Bearer not-a-real-token')
      .send({ name: 'Bad token', trigger: 'MALWARE_DETECTED', actions: ['ISOLATE_HOST'] });

    expect(res.status).toBe(401);
  });
});

describe('GET /playbooks', () => {
  it('returns an empty array for a user with no playbooks', async () => {
    const { token } = await registerUser();
    const res = await request(app).get('/playbooks').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.playbooks).toEqual([]);
  });

  it('a created playbook appears in a subsequent GET', async () => {
    const { token } = await registerUser();
    await request(app)
      .post('/playbooks')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Visible playbook', trigger: 'LOGIN_ATTEMPT', actions: ['NOTIFY_ADMIN'] });

    const res = await request(app).get('/playbooks').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.playbooks).toHaveLength(1);
    expect(res.body.playbooks[0]).toMatchObject({ name: 'Visible playbook' });
  });

  it('only returns the requesting user\'s own playbooks (cross-user isolation)', async () => {
    const userA = await registerUser();
    const userB = await registerUser();

    await request(app)
      .post('/playbooks')
      .set('Authorization', `Bearer ${userA.token}`)
      .send({ name: "A's playbook", trigger: 'PHISHING_ALERT', actions: ['BLOCK_IP'] });
    await request(app)
      .post('/playbooks')
      .set('Authorization', `Bearer ${userB.token}`)
      .send({ name: "B's playbook", trigger: 'PHISHING_ALERT', actions: ['BLOCK_IP'] });

    const resA = await request(app)
      .get('/playbooks')
      .set('Authorization', `Bearer ${userA.token}`);
    const resB = await request(app)
      .get('/playbooks')
      .set('Authorization', `Bearer ${userB.token}`);

    expect(resA.body.playbooks).toHaveLength(1);
    expect(resA.body.playbooks[0].name).toBe("A's playbook");
    expect(resB.body.playbooks).toHaveLength(1);
    expect(resB.body.playbooks[0].name).toBe("B's playbook");
  });

  it('rejects the request without a token with 401', async () => {
    const res = await request(app).get('/playbooks');
    expect(res.status).toBe(401);
  });
});

describe('DELETE /playbooks/:id', () => {
  it("deletes the caller's own playbook and it no longer appears in GET", async () => {
    const { token } = await registerUser();
    const createRes = await request(app)
      .post('/playbooks')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'To delete', trigger: 'MALWARE_DETECTED', actions: ['ISOLATE_HOST'] });
    const id = createRes.body.playbook.id;

    const deleteRes = await request(app)
      .delete(`/playbooks/${id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(deleteRes.status).toBe(204);

    const listRes = await request(app).get('/playbooks').set('Authorization', `Bearer ${token}`);
    expect(listRes.body.playbooks.find((p: { id: string }) => p.id === id)).toBeUndefined();
  });

  it("returns 404 for another user's playbook and does not delete it", async () => {
    const userA = await registerUser();
    const userB = await registerUser();

    const createRes = await request(app)
      .post('/playbooks')
      .set('Authorization', `Bearer ${userA.token}`)
      .send({ name: "A's playbook", trigger: 'MALWARE_DETECTED', actions: ['ISOLATE_HOST'] });
    const id = createRes.body.playbook.id;

    const deleteRes = await request(app)
      .delete(`/playbooks/${id}`)
      .set('Authorization', `Bearer ${userB.token}`);
    expect(deleteRes.status).toBe(404);

    // Confirm it's still there for the real owner — the ownership check
    // must reject the delete, not silently succeed.
    const listRes = await request(app)
      .get('/playbooks')
      .set('Authorization', `Bearer ${userA.token}`);
    expect(listRes.body.playbooks.find((p: { id: string }) => p.id === id)).toBeDefined();
  });

  it('returns 404 for a playbook id that does not exist', async () => {
    const { token } = await registerUser();
    const res = await request(app)
      .delete('/playbooks/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it('rejects the request without a token with 401', async () => {
    const res = await request(app).delete('/playbooks/00000000-0000-0000-0000-000000000000');
    expect(res.status).toBe(401);
  });
});
