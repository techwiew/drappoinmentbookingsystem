// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { AppointmentCalendar } from './AppointmentCalendar.js';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../components/shared/OpenConsultationButton.js', () => ({ OpenConsultationButton: () => <button>Open Consultation</button> }));
vi.mock('../../context/AuthContext.js', () => ({ useAuth: () => ({ role: 'DOCTOR' }) }));
const renderCalendar = (props: React.ComponentProps<typeof AppointmentCalendar>) => render(<QueryClientProvider client={new QueryClient()}><AppointmentCalendar {...props} /></QueryClientProvider>);
afterEach(cleanup);
describe('calendar interaction', () => {
  it('places an appointment at its scheduled time and opens details', () => {
    renderCalendar({ dates: ['2026-09-20'], loading: false, appointments: [{ id: 'a', patientId: 'p', doctorId: 'd', patientName: 'Patient A', doctorName: 'Doctor A', appointmentDate: '2026-09-20T00:00:00Z', appointmentTime: '02:00 PM', status: 'BOOKED' }] });
    const event = screen.getByRole('button', { name: /Patient A/ });
    expect(event.style.top).toBe('1344px');
    fireEvent.click(event);
    expect(screen.getByText('Appointment details')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Open Consultation' })).toBeTruthy();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByText('Appointment details')).toBeNull();
  });
  it('keeps unconfirmed times visible outside the hourly grid', () => {
    renderCalendar({ dates: ['2026-09-20'], loading: false, appointments: [{ id: 'b', patientName: 'Patient B', appointmentDate: '2026-09-20', appointmentTime: null, status: 'PENDING_CONFIRMATION' }] });
    expect(screen.getByText('Time to confirm')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Patient B/ }).style.top).toBe('');
  });
});
