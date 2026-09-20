import { beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';

const completeMock = vi.hoisted(() => vi.fn());
vi.mock('../middlewares/auth.js', () => ({
  authenticate: (req: any, res: any, next: any) => {
    const role = req.headers['x-test-role'];
    if (!role) return res.status(401).json({ success: false });
    req.user = { userId: 'user-1', role };
    req.tenant = { clinicId: req.headers['x-test-clinic'] || 'clinic-a' };
    next();
  },
}));
vi.mock('../modules/queue/queue.service.js', () => ({ QueueService: { completeAtReception: completeMock } }));

import queueRoutes from '../modules/queue/queue.routes.js';

const app = express();
app.use('/api/queue', queueRoutes);
app.use((error: any, _req: any, res: any, _next: any) => res.status(error.statusCode || 500).json({ success: false, error: { code: error.code } }));

describe('reception completion route', () => {
  beforeEach(() => vi.clearAllMocks());

  it('accepts an authenticated receptionist and forwards the clinic ID', async () => {
    completeMock.mockResolvedValue({ id: 'apt-1', status: 'COMPLETED' });
    const response = await request(app).post('/api/queue/apt-1/reception-complete').set('x-test-role', 'RECEPTIONIST').set('x-test-clinic', 'clinic-a');
    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe('COMPLETED');
    expect(completeMock).toHaveBeenCalledWith('clinic-a', 'apt-1', 'user-1');
  });

  it('rejects missing login and doctor role before updating anything', async () => {
    expect((await request(app).post('/api/queue/apt-1/reception-complete')).status).toBe(401);
    expect((await request(app).post('/api/queue/apt-1/reception-complete').set('x-test-role', 'DOCTOR')).status).toBe(403);
    expect(completeMock).not.toHaveBeenCalled();
  });

  it('passes through other-clinic and repeated-completion errors', async () => {
    completeMock.mockRejectedValueOnce({ statusCode: 404, code: 'NOT_FOUND' }).mockRejectedValueOnce({ statusCode: 409, code: 'NOT_COMPLETABLE' });
    const other = await request(app).post('/api/queue/apt-1/reception-complete').set('x-test-role', 'RECEPTIONIST').set('x-test-clinic', 'clinic-b');
    const repeated = await request(app).post('/api/queue/apt-1/reception-complete').set('x-test-role', 'RECEPTIONIST');
    expect(other.status).toBe(404);
    expect(repeated.status).toBe(409);
    expect(completeMock).toHaveBeenNthCalledWith(1, 'clinic-b', 'apt-1', 'user-1');
  });
});
