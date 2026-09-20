import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ create: vi.fn(), send: vi.fn() }));
vi.mock('../lib/prisma.js', () => ({ prisma: { inquiry: { create: mocks.create } } }));
vi.mock('../services/email.service.js', () => ({ sendEmail: mocks.send }));

import { ContactService } from '../modules/contact/contact.service.js';

describe('demo notification', () => {
  it('stores the request and sends the clinic details to the configured mailbox', async () => {
    mocks.create.mockResolvedValue({ id: 'demo-1', name: 'Clinic A', phone: '123456789012', clinicType: 'Polyclinic', city: 'Delhi' });
    mocks.send.mockResolvedValue({});
    const result = await ContactService.createInquiry({ name: ' Clinic A ', phone: '123456789012', clinicType: 'Polyclinic', city: 'Delhi' });
    expect(result.id).toBe('demo-1');
    expect(mocks.send).toHaveBeenCalledWith(expect.objectContaining({ subject: 'New Demo Request - MediNovel', text: expect.stringContaining('Clinic A') }));
  });
});
