import { afterEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';

afterEach(() => vi.restoreAllMocks());

describe('request logging', () => {
  it('correlates a validation failure without logging credentials or query values', async () => {
    const info = vi.spyOn(console, 'log').mockImplementation(() => {});
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const response = await request(createApp())
      .post('/api/auth/login?token=query-secret')
      .set('x-request-id', 'booking-debug-123')
      .send({ email: 'invalid', password: 'body-secret' });

    expect(response.status).toBe(400);
    expect(response.headers['x-request-id']).toBe('booking-debug-123');
    const logs = [...info.mock.calls, ...warning.mock.calls].map(([entry]) => JSON.parse(entry as string));
    expect(logs.map((entry) => entry.event)).toContain('http.request.started');
    expect(logs).toContainEqual(expect.objectContaining({
      event: 'http.request.completed', requestId: 'booking-debug-123',
      statusCode: 400, errorCode: 'VALIDATION_ERROR',
    }));
    expect(JSON.stringify(logs)).not.toContain('body-secret');
    expect(JSON.stringify(logs)).not.toContain('query-secret');
  });
});
