// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OpenConsultationButton } from './OpenConsultationButton.js';

const mocks = vi.hoisted(() => ({ post: vi.fn(), navigate: vi.fn(), auth: { role: 'DOCTOR', doctorId: 'doctor' } }));
vi.mock('../../api/client.js', () => ({ apiClient: { post: mocks.post } }));
vi.mock('../../context/AuthContext.js', () => ({ useAuth: () => mocks.auth }));
vi.mock('react-router-dom', () => ({ useNavigate: () => mocks.navigate }));

const show = (status?: string) => render(<QueryClientProvider client={new QueryClient({ defaultOptions: { mutations: { retry: false } } })}><OpenConsultationButton patientId="patient" appointment={status ? { id: 'appointment', doctorId: 'doctor', patientId: 'patient', status } : undefined} /></QueryClientProvider>);
afterEach(() => { cleanup(); vi.clearAllMocks(); mocks.auth.role = 'DOCTOR'; });

describe('Open Consultation action', () => {
  it('starts a booked appointment before navigating', async () => {
    mocks.post.mockResolvedValue({}); show('BOOKED');
    fireEvent.click(screen.getByRole('button', { name: 'Open Consultation' }));
    await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith('/queue/appointment/consult'));
    expect(mocks.post).toHaveBeenCalledWith('/queue/appointment/start');
  });
  it('opens completed consultation without restarting it', async () => {
    show('COMPLETED'); fireEvent.click(screen.getByRole('button', { name: 'Open Consultation' }));
    await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith('/queue/appointment/consult'));
    expect(mocks.post).not.toHaveBeenCalled();
  });
  it('opens a patient record and shows server errors without navigating', async () => {
    mocks.post.mockRejectedValue({ response: { data: { error: { message: 'Please retry' } } } });
    show(); fireEvent.click(screen.getByRole('button', { name: 'Open Consultation' }));
    await screen.findByRole('alert');
    expect(mocks.post).toHaveBeenCalledWith('/consultations/open', { patientId: 'patient' });
    expect(mocks.navigate).not.toHaveBeenCalled();
  });
  it('disables cancelled appointments and hides the action from reception', () => {
    show('CANCELLED'); expect((screen.getByRole('button') as HTMLButtonElement).disabled).toBe(true);
    cleanup(); mocks.auth.role = 'RECEPTIONIST'; show('BOOKED');
    expect(screen.queryByRole('button')).toBeNull();
  });
});
