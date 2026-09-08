import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.js';
import { Card } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { Input } from '../../components/ui/Input.js';
import { Select } from '../../components/ui/Select.js';
import { Textarea } from "../../components/ui/Textarea.js";
import { Modal } from "../../components/ui/Modal.js";
import { StatusBadge, Badge } from "../../components/ui/Badge.js";
import { DuplicatePatientModal } from "../../components/shared/DuplicatePatientModal.js";
import {
  Calendar,
  Plus,
  Search,
  Clock,
  User,
  Stethoscope,
  Filter,
  Phone,
} from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";

export const AppointmentsPage: React.FC = () => {
  const { doctorId, role } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [isBookModalOpen, setIsBookModalOpen] = useState(
    !!searchParams.get("patientId"),
  );
  const [dateFilter, setDateFilter] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [isNewPatient, setIsNewPatient] = useState(false);
  const [duplicates, setDuplicates] = useState<any[]>([]);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [pendingPatientPayload, setPendingPatientPayload] = useState<any>(null);
  const [bookingError, setBookingError] = useState("");
  const [followUpToConfirm, setFollowUpToConfirm] = useState<any>(null);
  const [confirmationTime, setConfirmationTime] = useState("");
  const [newPatientForm, setNewPatientForm] = useState({
    fullName: "",
    mobile: "",
    email: "",
    gender: "MALE",
    age: "",
    address: "",
    notes: "",
  });

  const [bookForm, setBookForm] = useState({
    patientId: searchParams.get("patientId") || "",
    doctorId: doctorId || "",
    appointmentDate: new Date().toISOString().split("T")[0],
    appointmentTime: "09:00",
    appointmentType: "WALK_IN",
    directCheckIn: true,
    notes: "",
  });

  const { data: appointments, isLoading } = useQuery({
    queryKey: ["appointments", dateFilter, statusFilter, doctorId, role],
    queryFn: async () => {
      const params: any = { date: dateFilter };
      if (statusFilter) params.status = statusFilter;
      if (role === "DOCTOR" && doctorId) params.doctorId = doctorId;
      const res = await apiClient.get("/appointments", { params });
      return res.data.data;
    },
    refetchInterval: 15000,
  });

  const { data: patients } = useQuery({
    queryKey: ["patients-list"],
    queryFn: async () => {
      const res = await apiClient.get("/patients", { params: { search } });
      return res.data.data;
    },
    enabled: isBookModalOpen,
  });

  const { data: doctors } = useQuery({
    queryKey: ["doctors-list"],
    queryFn: async () => {
      const res = await apiClient.get("/doctors");
      return res.data.data;
    },
    enabled: isBookModalOpen && role !== "DOCTOR",
  });

  const bookMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiClient.post("/appointments", payload);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["live-queue"] });
      setIsBookModalOpen(false);
    },
  });

  const createPatientMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiClient.post("/patients", payload);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients-list"] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.patch(`/appointments/${id}/status`, {
        status: "CANCELLED",
      });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });

  const confirmFollowUpMutation = useMutation({
    mutationFn: async ({ id, appointmentTime }: { id: string; appointmentTime: string }) => {
      const res = await apiClient.patch(`/appointments/${id}`, {
        status: "BOOKED",
        appointmentTime: appointmentTime || undefined,
      });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      setFollowUpToConfirm(null);
      setConfirmationTime("");
    },
  });

  const scheduleAppointment = async (patientId: string) => {
    const selectedDoctorId = bookForm.doctorId || doctorId;
    if (!selectedDoctorId) {
      setBookingError("Select a doctor before generating a queue token.");
      return;
    }

    await bookMutation.mutateAsync({
      ...bookForm,
      patientId,
      doctorId: selectedDoctorId,
    });
  };

  const checkForDuplicatePatient = async (payload: any) => {
    const res = await apiClient.get("/patients/check-duplicate", {
      params: { mobile: payload.mobile, fullName: payload.fullName },
    });
    return res.data.data.matches || [];
  };

  const createPatientAndSchedule = async (payload: any) => {
    try {
      setBookingError("");
      const patient = await createPatientMutation.mutateAsync(payload);
      await scheduleAppointment(patient.id);
    } catch (error: any) {
      setBookingError(
        error.response?.data?.error?.message ||
          "Unable to create the patient and generate a queue token.",
      );
    }
  };

  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError("");

    if (!(bookForm.doctorId || doctorId)) {
      setBookingError("Select a doctor before generating a queue token.");
      return;
    }

    if (!isNewPatient) {
      try {
        await scheduleAppointment(bookForm.patientId);
      } catch (error: any) {
        setBookingError(
          error.response?.data?.error?.message ||
            "Unable to generate a queue token.",
        );
      }
      return;
    }

    const payload = {
      ...newPatientForm,
      age: newPatientForm.age ? parseInt(newPatientForm.age, 10) : undefined,
    };

    try {
      const matches = await checkForDuplicatePatient(payload);
      if (matches.length > 0) {
        setDuplicates(matches);
        setPendingPatientPayload(payload);
        setIsDuplicateModalOpen(true);
        return;
      }
      await createPatientAndSchedule(payload);
    } catch (error: any) {
      setBookingError(
        error.response?.data?.error?.message ||
          "Unable to check for duplicate patients.",
      );
    }
  };

  const handleBookExistingPatient = async (patientId: string) => {
    setIsDuplicateModalOpen(false);
    setIsNewPatient(false);
    setBookForm((current) => ({ ...current, patientId }));
    try {
      await scheduleAppointment(patientId);
    } catch (error: any) {
      setBookingError(
        error.response?.data?.error?.message ||
          "Unable to generate a queue token.",
      );
    }
  };

  const handleCreateNewPatient = async () => {
    setIsDuplicateModalOpen(false);
    if (pendingPatientPayload) await createPatientAndSchedule(pendingPatientPayload);
  };

  const filteredApts =
    appointments?.filter(
      (a: any) =>
        !search ||
        a.patientName?.toLowerCase().includes(search.toLowerCase()) ||
        a.patientNumber?.toLowerCase().includes(search.toLowerCase()),
    ) || [];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Calendar className="w-6 h-6 text-brand-600" />
            Appointment Schedule
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {filteredApts.length} appointment(s) for{" "}
            {new Date(dateFilter).toLocaleDateString(undefined, {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setIsBookModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Book Appointment
        </Button>
      </div>

      {/* Filter Bar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full sm:w-44"
          />
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search patient name or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-44 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">All Statuses</option>
            <option value="WAITING">Waiting</option>
            <option value="IN_CONSULTATION">In Consultation</option>
            <option value="COMPLETED">Completed</option>
            <option value="BOOKED">Booked</option>
            <option value="PENDING_CONFIRMATION">Pending Confirmation</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </Card>

      {/* Appointments Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3.5">Token</th>
                <th className="p-3.5">Patient</th>
                <th className="p-3.5">Doctor</th>
                <th className="p-3.5">Time</th>
                <th className="p-3.5">Type</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Payment</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="text-center p-10 text-slate-400">
                    Loading appointments...
                  </td>
                </tr>
              ) : filteredApts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center p-10">
                    <Calendar className="w-10 h-10 mx-auto text-slate-200 mb-2" />
                    <p className="text-slate-400">
                      No appointments for this date
                    </p>
                    <Button
                      className="mt-3"
                      size="sm"
                      onClick={() => setIsBookModalOpen(true)}
                    >
                      Book First Appointment
                    </Button>
                  </td>
                </tr>
              ) : (
                filteredApts.map((apt: any) => (
                  <tr
                    key={apt.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="p-3.5">
                      <span className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                        {apt.tokenNumber}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="font-semibold text-slate-900 cursor-pointer hover:text-brand-700"
                          onClick={() => navigate(`/patients/${apt.patientId}`)}
                        >
                          {apt.patientName}
                        </span>
                        {apt.patientMobile && (
                          <a
                            href={`tel:${apt.patientMobile}`}
                            onClick={(e) => e.stopPropagation()}
                            className="p-1 rounded text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                            title={`Call ${apt.patientName} (${apt.patientMobile})`}
                          >
                            <Phone className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
                        <span>{apt.patientNumber}</span>
                        {apt.patientMobile && <span>{apt.patientMobile}</span>}
                      </div>
                    </td>
                    <td className="p-3.5 text-slate-700 font-medium">
                      {apt.doctorName}
                    </td>
                    <td className="p-3.5 text-slate-600">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {apt.appointmentTime || (
                          <span className="text-amber-700 font-medium">To be confirmed</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <Badge variant="default" size="sm">
                        {apt.appointmentType?.replace(/_/g, " ")}
                      </Badge>
                    </td>
                    <td className="p-3.5">
                      <StatusBadge status={apt.status} size="sm" />
                    </td>
                    <td className="p-3.5">
                      <StatusBadge
                        status={apt.paymentStatus || "PENDING"}
                        size="sm"
                      />
                    </td>
                    <td className="p-3.5 text-right space-x-1.5">
                      {apt.status === "PENDING_CONFIRMATION" && (
                        <Button
                          size="sm"
                          variant="primary"
                          className="text-[11px]"
                          onClick={() => {
                            setFollowUpToConfirm(apt);
                            setConfirmationTime(apt.appointmentTime || "");
                          }}
                        >
                          Confirm Visit
                        </Button>
                      )}
                      {apt.status === "IN_CONSULTATION" && (
                        <Button
                          size="sm"
                          variant="primary"
                          className="text-[11px]"
                          onClick={() => navigate(`/queue/${apt.id}/consult`)}
                        >
                          Open Consultation
                        </Button>
                      )}
                      {(apt.status === "WAITING" ||
                        apt.status === "BOOKED" ||
                        apt.status === "PENDING_CONFIRMATION") && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-[11px] text-rose-600 hover:bg-rose-50"
                          onClick={() => cancelMutation.mutate(apt.id)}
                        >
                          Cancel
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Book Appointment Modal */}
      <Modal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        title="Book New Appointment"
        description="Select patient, doctor, date, and time to generate a queue token."
        maxWidth="2xl"
      >
        <form onSubmit={handleBookSubmit} className="space-y-4">
          {/* Patient Select or inline registration */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Patient <span className="text-rose-500">*</span>
            </label>
            <div className="flex gap-2 mb-2">
              <Button
                type="button"
                size="sm"
                variant={!isNewPatient ? "primary" : "outline"}
                onClick={() => setIsNewPatient(false)}
              >
                Select Existing
              </Button>
              <Button
                type="button"
                size="sm"
                variant={isNewPatient ? "primary" : "outline"}
                onClick={() => setIsNewPatient(true)}
              >
                Add New Patient
              </Button>
            </div>
            {!isNewPatient ? (
              <>
                <div className="relative mb-2">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search patient by name or mobile..."
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <select
                  value={bookForm.patientId}
                  onChange={(e) =>
                    setBookForm({ ...bookForm, patientId: e.target.value })
                  }
                  required
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">-- Select Patient --</option>
                  {patients?.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName} ({p.patientNumber}) — {p.mobile}
                    </option>
                  ))}
                </select>
              </>
            ) : (
              <div className="space-y-3 rounded-xl border border-brand-100 bg-brand-50/40 p-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Patient Name"
                    required
                    value={newPatientForm.fullName}
                    onChange={(e) =>
                      setNewPatientForm({
                        ...newPatientForm,
                        fullName: e.target.value,
                      })
                    }
                  />
                  <Input
                    label="Mobile"
                    required
                    pattern="[0-9]{10}"
                    maxLength={10}
                    value={newPatientForm.mobile}
                    onChange={(e) =>
                      setNewPatientForm({
                        ...newPatientForm,
                        mobile: e.target.value.replace(/\D/g, "").slice(0, 10),
                      })
                    }
                  />
                  <Input
                    label="Email (optional)"
                    type="email"
                    value={newPatientForm.email}
                    onChange={(e) =>
                      setNewPatientForm({
                        ...newPatientForm,
                        email: e.target.value,
                      })
                    }
                  />
                  <Select
                    label="Gender"
                    value={newPatientForm.gender}
                    onChange={(e) =>
                      setNewPatientForm({
                        ...newPatientForm,
                        gender: e.target.value,
                      })
                    }
                    options={[
                      { value: "MALE", label: "Male" },
                      { value: "FEMALE", label: "Female" },
                      { value: "OTHER", label: "Other" },
                    ]}
                  />
                  <Input
                    label="Age"
                    type="number"
                    min="0"
                    max="150"
                    value={newPatientForm.age}
                    onChange={(e) =>
                      setNewPatientForm({
                        ...newPatientForm,
                        age: e.target.value,
                      })
                    }
                  />
                  <Input
                    label="Address"
                    value={newPatientForm.address}
                    onChange={(e) =>
                      setNewPatientForm({
                        ...newPatientForm,
                        address: e.target.value,
                      })
                    }
                  />
                </div>
                <Textarea
                  label="Notes / Other Details"
                  value={newPatientForm.notes}
                  onChange={(e) =>
                    setNewPatientForm({
                      ...newPatientForm,
                      notes: e.target.value,
                    })
                  }
                />
                <p className="text-xs text-slate-500">
                  Generating the token will create this patient and add them to the queue.
                </p>
              </div>
            )}
          </div>

          {/* Doctor Select (Receptionist only or multi-doc) */}
          {role !== "DOCTOR" && doctors && doctors.length > 0 && (
            <Select
              label="Select Doctor"
              required
              value={bookForm.doctorId}
              onChange={(e) =>
                setBookForm({ ...bookForm, doctorId: e.target.value })
              }
              options={[
                { value: "", label: "-- Select Doctor --" },
                ...doctors.map((d: any) => ({
                  value: d.id,
                  label: `${d.name} — ${d.specialization}`,
                })),
              ]}
            />
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Appointment Date"
              type="date"
              required
              value={bookForm.appointmentDate}
              onChange={(e) =>
                setBookForm({ ...bookForm, appointmentDate: e.target.value })
              }
            />
            <Input
              label="Appointment Time"
              type="time"
              required
              value={bookForm.appointmentTime}
              onChange={(e) =>
                setBookForm({ ...bookForm, appointmentTime: e.target.value })
              }
            />
          </div>

          <Select
            label="Appointment Type"
            value={bookForm.appointmentType}
            onChange={(e) =>
              setBookForm({ ...bookForm, appointmentType: e.target.value })
            }
            options={[
              { value: "WALK_IN", label: "Walk In" },
              { value: "NEW_PATIENT", label: "New Patient" },
              { value: "FOLLOW_UP", label: "Follow Up" },
              { value: "EMERGENCY", label: "Emergency" },
            ]}
          />

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="directCheckIn"
              checked={bookForm.directCheckIn}
              onChange={(e) =>
                setBookForm({ ...bookForm, directCheckIn: e.target.checked })
              }
              className="w-4 h-4 accent-brand-600 rounded"
            />
            <label
              htmlFor="directCheckIn"
              className="text-xs font-medium text-slate-700"
            >
              Direct Check-In (Patient is present now — add to today's WAITING
              queue immediately)
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsBookModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={bookMutation.isPending || createPatientMutation.isPending}
            >
              {isNewPatient ? "Create Patient & Generate Token" : "Generate Queue Token"}
            </Button>
          </div>
          {bookingError && (
            <p className="text-right text-xs font-medium text-rose-600">
              {bookingError}
            </p>
          )}
        </form>
      </Modal>
      <Modal
        isOpen={!!followUpToConfirm}
        onClose={() => setFollowUpToConfirm(null)}
        title="Confirm Follow-up Visit"
        description={followUpToConfirm ? `Confirm ${followUpToConfirm.patientName}'s follow-up after speaking with the patient.` : undefined}
        maxWidth="sm"
      >
        <div className="space-y-4">
          <Input
            label="Confirmed time (optional)"
            type="time"
            value={confirmationTime}
            onChange={(event) => setConfirmationTime(event.target.value)}
          />
          <p className="text-xs text-slate-500">
            Leave the time blank if the patient has confirmed the visit but the slot will be decided later.
          </p>
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setFollowUpToConfirm(null)}>Cancel</Button>
            <Button
              variant="primary"
              isLoading={confirmFollowUpMutation.isPending}
              onClick={() => followUpToConfirm && confirmFollowUpMutation.mutate({
                id: followUpToConfirm.id,
                appointmentTime: confirmationTime,
              })}
            >
              Confirm Appointment
            </Button>
          </div>
        </div>
      </Modal>
      <DuplicatePatientModal
        isOpen={isDuplicateModalOpen}
        onClose={() => setIsDuplicateModalOpen(false)}
        duplicates={duplicates}
        onUseExisting={handleBookExistingPatient}
        onForceCreate={handleCreateNewPatient}
        forceCreateLabel="Create New Patient & Generate Token"
        isLoading={bookMutation.isPending || createPatientMutation.isPending}
      />
    </div>
  );
};
