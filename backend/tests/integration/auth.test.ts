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

  it('logs in successfully when the email casing differs from registration (case-insensitive email)', async () => {
    const email = freshEmail();
    const password = 'password123';
    // freshEmail() always returns a lowercase address; register with it as-is
    // and log in with an uppercased version of the same address.
    await request(app).post('/auth/register').send({ email, password });

    const res = await request(app).post('/auth/login').send({ email: email.toUpperCase(), password });

    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user.email).toBe(email);
  });
});

describe('POST /auth/register — concurrent duplicate submissions', () => {
  it('resolves N concurrent registrations for the same email to exactly one 201 and the rest 409 (never 500)', async () => {
    const email = freshEmail();
    const password = 'password123';
    const concurrency = 5;

    const responses = await Promise.all(
      Array.from({ length: concurrency }, () =>
        request(app).post('/auth/register').send({ email, password })
      )
    );

    const created = responses.filter((r) => r.status === 201);
    const conflicted = responses.filter((r) => r.status === 409);
    const other = responses.filter((r) => r.status !== 201 && r.status !== 409);

    expect(other).toHaveLength(0); // in particular, no 500s
    expect(created).toHaveLength(1);
    expect(conflicted).toHaveLength(concurrency - 1);
    conflicted.forEach((r) => expect(r.body.error).toEqual(expect.any(String)));
  });
});
