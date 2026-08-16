import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { getTestApp } from '../helpers/testApp.js';
import { cleanupUsersByEmail, uniqueEmail } from '../helpers/testDb.js';

const app = getTestApp();
const createdEmails: string[] = [];

function freshEmail(): string {
  const email = uniqueEmail('auth');
  createdEmails.push(email);
  return email;
}

afterAll(async () => {
  await cleanupUsersByEmail(...createdEmails);
});

describe('POST /auth/register', () => {
  it('registers a new user and returns a token + user', async () => {
    const email = freshEmail();
    const res = await request(app)
      .post('/auth/register')
      .send({ email, password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user).toMatchObject({ email });
    expect(res.body.user.id).toEqual(expect.any(String));
  });

  it('rejects a duplicate email with 409', async () => {
    const email = freshEmail();
    await request(app).post('/auth/register').send({ email, password: 'password123' });

    const res = await request(app)
      .post('/auth/register')
      .send({ email, password: 'anotherPassword1' });

    expect(res.status).toBe(409);
    expect(res.body.error).toEqual(expect.any(String));
  });

  it('rejects a missing password with 400, not 500', async () => {
    const email = freshEmail();
    const res = await request(app).post('/auth/register').send({ email });

    expect(res.status).toBe(400);
    expect(res.body.error).toEqual(expect.any(String));
  });

  it('rejects a malformed email with 400', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'not-an-email', password: 'password123' });

    expect(res.status).toBe(400);
  });

  it('rejects a password under 8 characters with 400', async () => {
    const email = freshEmail();
    const res = await request(app).post('/auth/register').send({ email, password: 'short' });

    expect(res.status).toBe(400);
  });
});

describe('POST /auth/login', () => {
  it('logs in with correct credentials and returns a token', async () => {
    const email = freshEmail();
    const password = 'password123';
    await request(app).post('/auth/register').send({ email, password });

    const res = await request(app).post('/auth/login').send({ email, password });

    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user).toMatchObject({ email });
  });

  it('rejects the wrong password with 401', async () => {
    const email = freshEmail();
    await request(app).post('/auth/register').send({ email, password: 'password123' });

    const res = await request(app)
      .post('/auth/login')
      .send({ email, password: 'wrongPassword1' });

    expect(res.status).toBe(401);
    expect(res.body.error).toEqual(expect.any(String));
  });

  it('rejects an unknown email with 401 (not 404, to avoid user enumeration)', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: uniqueEmail('nonexistent'), password: 'password123' });

    expect(res.status).toBe(401);
  });

  it('returns the same generic error message for wrong password and unknown email', async () => {
    const email = freshEmail();
    await request(app).post('/auth/register').send({ email, password: 'password123' });

    const wrongPassword = await request(app)
      .post('/auth/login')
      .send({ email, password: 'wrongPassword1' });
    const unknownEmail = await request(app)
      .post('/auth/login')
      .send({ email: uniqueEmail('nonexistent'), password: 'password123' });

    expect(wrongPassword.body.error).toBe(unknownEmail.body.error);
  });

  it('rejects missing fields with 400', async () => {
    const res = await request(app).post('/auth/login').send({});
    expect(res.status).toBe(400);
  });
});
