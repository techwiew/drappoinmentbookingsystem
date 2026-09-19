import { afterEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { prisma } from '../lib/prisma.js';
import { generateAccessToken } from '../utils/jwt.js';

afterEach(() => vi.restoreAllMocks());

describe('login error responses', () => {
  it('explains a database outage without exposing Prisma details', async () => {
    vi.spyOn(prisma.user, 'findUnique').mockRejectedValueOnce({
      code: 'P1001',
      message: "Invalid `prisma.user.findUnique()` invocation: Can't reach database server at `localhost:3306`",
    });

    const response = await request(createApp()).post('/api/auth/login').send({
      email: 'person@example.com',
      password: 'Password123',
    });

    expect(response.status).toBe(503);
    expect(response.body.error).toEqual({
      code: 'SERVICE_UNAVAILABLE',
      message: 'The service is temporarily unavailable. Please try again shortly.',
    });
    expect(JSON.stringify(response.body)).not.toContain('localhost:3306');
  });

  it('keeps unexpected internal errors generic', async () => {
    vi.spyOn(prisma.user, 'findUnique').mockRejectedValueOnce(new Error('private database details'));

    const response = await request(createApp()).post('/api/auth/login').send({
      email: 'person@example.com',
      password: 'Password123',
    });

    expect(response.status).toBe(500);
    expect(response.body.error).toEqual({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Something went wrong. Please try again later.',
    });
  });

  it('does not misreport a database outage as an expired session', async () => {
    vi.spyOn(prisma.user, 'findUnique').mockRejectedValueOnce({ code: 'P1001' });
    const token = generateAccessToken({ userId: 'user-1', email: 'person@example.com', role: 'DOCTOR' });

    const response = await request(createApp())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(503);
    expect(response.body.error.code).toBe('SERVICE_UNAVAILABLE');
  });
});
