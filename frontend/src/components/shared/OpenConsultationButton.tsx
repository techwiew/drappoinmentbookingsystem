import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../api/client.js';
import { getApiErrorMessage } from '../../api/errors.js';
import { useAuth } from '../../context/AuthContext.js';
import { Button } from '../ui/Button.js';

export interface ConsultationAppointment {
  id: string;
  patientId: string;
  doctorId: string;
  status: string;
}

export const OpenConsultationButton: React.FC<{ patientId: string; appointment?: ConsultationAppointment }> = ({ patientId, appointment }) => {
  const { role, doctorId } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async () => {
      if (appointment) {
        if (!['IN_CONSULTATION', 'COMPLETED'].includes(appointment.status)) {
          await apiClient.post(`/queue/${appointment.id}/start`);
        }
        return appointment.id;
      }
      return (await apiClient.post('/consultations/open', { patientId })).data.data.appointmentId as string;
    },
    onSuccess: (id) => {
      for (const key of ['appointments', 'live-queue', 'doctor-kpis', 'reports-doctor-dash', 'reception-queue', 'patient-consultations']) {
        void queryClient.invalidateQueries({ queryKey: [key] });
      }
      navigate(`/queue/${id}/consult`);
    },
  });
  if (role !== 'DOCTOR' || (appointment && appointment.doctorId !== doctorId)) return null;
  const eligible = !appointment || ['BOOKED', 'CHECKED_IN', 'WAITING', 'READY_FOR_DOCTOR', 'IN_CONSULTATION', 'COMPLETED'].includes(appointment.status);
  return <span className="inline-flex flex-col items-start gap-1" onClick={(event) => event.stopPropagation()}>
    <Button size="sm" disabled={!eligible} title={eligible ? 'Open Consultation' : 'Confirm or rebook this appointment before consultation'} isLoading={mutation.isPending} onClick={() => mutation.mutate()}>Open Consultation</Button>
    {mutation.isError && <span role="alert" className="text-xs text-rose-700">{getApiErrorMessage(mutation.error, 'Unable to open consultation. Please retry.')}</span>}
  </span>;
};
