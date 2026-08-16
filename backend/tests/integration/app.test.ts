import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { getTestApp } from '../helpers/testApp.js';

const app = getTestApp();

describe('unmatched routes', () => {
  it("returns a JSON 404 body, not Express's default HTML error page", async () => {
    const res = await request(app).get('/nope');

    expect(res.status).toBe(404);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body).toEqual({ error: 'Not found' });
    // The default Express 404 page is HTML and contains a stack trace —
    // make sure we didn't fall through to it.
    expect(res.text).not.toMatch(/<pre>/i);
  });

  it('returns a JSON 404 for an unmatched POST route too, not just GET', async () => {
    const res = await request(app).post('/also/nope').send({});

    expect(res.status).toBe(404);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body.error).toEqual(expect.any(String));
  });
});

describe('response headers', () => {
  it('does not expose X-Powered-By: Express', async () => {
    const res = await request(app).get('/health');

    expect(res.headers['x-powered-by']).toBeUndefined();
  });
});
