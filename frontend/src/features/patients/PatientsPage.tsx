import { OpenConsultationButton } from '../../components/shared/OpenConsultationButton.js';
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client.js';
import { Card } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { Input } from '../../components/ui/Input.js';
import { Select } from '../../components/ui/Select.js';
import { Textarea } from '../../components/ui/Textarea.js';
import { Modal } from '../../components/ui/Modal.js';
import { Badge } from '../../components/ui/Badge.js';
import { DuplicatePatientModal } from '../../components/shared/DuplicatePatientModal.js';
import {
  Search,
  Plus,
  UserCircle,
  Phone,
  Droplets,
  AlertCircle,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { getApiErrorMessage } from '../../api/errors.js';

export const PatientsPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { doctorId } = useAuth();

  const normalizeMobileInput = (value: string) => value.replace(/\D/g, '').slice(0, 12);

  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  const [duplicates, setDuplicates] = useState<any[]>([]);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<any>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<string | null>(null);

  const [form, setForm] = useState({
    fullName: '',
    mobile: '',
    email: '',
    gender: 'MALE',
    age: '',
    dateOfBirth: '',
    bloodGroup: '',
    allergies: '',
    existingIllness: '',
    address: '',
    city: '',
    emergencyContactName: '',
    emergencyContactMobile: '',
    notes: '',
    doctorIds: doctorId ? [doctorId] : [],
  });

  const { data: patients, isLoading } = useQuery({
    queryKey: ['patients', search, genderFilter],
    queryFn: async () => {
      const res = await apiClient.get('/patients', {
        params: { search, gender: genderFilter || undefined },
      });
      return res.data.data;
    },
  });

  const { data: doctors } = useQuery({
    queryKey: ['clinic-doctors'],
    queryFn: async () => {
      const res = await apiClient.get('/doctors');
      return res.data.data;
    },
  });

  const createPatientMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiClient.post('/patients', payload);
      return res.data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      setIsRegModalOpen(false);
      setFeedback('Patient registered successfully.');
      navigate(`/patients/${data.id}`);
    },
    onError: (error) => setFeedback(getApiErrorMessage(error, 'Unable to register patient. Please try again.')),
  });

  const checkDuplicate = async () => {
    if (!form.mobile && !form.fullName) return false;
    try {
      const res = await apiClient.get('/patients/check-duplicate', {
        params: { mobile: form.mobile, fullName: form.fullName },
      });
      const matches = res.data.data.matches || [];
      if (matches.length > 0) {
        setDuplicates(matches);
        return true;
      }
    } catch (e) {}
    return false;
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (createPatientMutation.isPending) return;
    const errors: Record<string, string> = {};
    if (!/^[A-Za-z][A-Za-z .'-]{1,}$/.test(form.fullName.trim())) errors.fullName = 'Enter a valid full name (letters and spaces only).';
    if (!/^\d{1,12}$/.test(form.mobile)) errors.mobile = 'Enter up to 12 digits.';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errors.email = 'Enter a valid email address.';
    if (form.age && (!/^\d+$/.test(form.age) || Number(form.age) > 150)) errors.age = 'Age must be a whole number from 0 to 150.';
    if (form.emergencyContactMobile && !/^\d{1,12}$/.test(form.emergencyContactMobile)) errors.emergencyContactMobile = 'Enter up to 12 digits.';
    setFormErrors(errors);
    if (Object.keys(errors).length) { setFeedback('Please correct the highlighted fields.'); return; }
    setFeedback(null);
    const payload = {
      ...form,
      age: form.age ? parseInt(form.age) : undefined,
    };
    setPendingFormData(payload);

    const hasDuplicates = await checkDuplicate();
    if (hasDuplicates) {
      setIsDuplicateModalOpen(true);
    } else {
      createPatientMutation.mutate(payload);
    }
  };

  const handleForceCreate = () => {
    setIsDuplicateModalOpen(false);
    if (pendingFormData) {
      createPatientMutation.mutate(pendingFormData);
    }
  };

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  return (
    <div className="space-y-5">
      {feedback && <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">{feedback}</div>}
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 min-w-0">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Patient Directory</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {patients?.length ?? 0} patients registered in this clinic
          </p>
        </div>
        <Button
          variant="primary"
          className="self-start sm:self-auto shrink-0"
          onClick={() => setIsRegModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Register New Patient
        </Button>
      </div>

      {/* Search & Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 min-w-0 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search patient by name, mobile, or patient ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
            className="w-full sm:w-36 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">All Genders</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
      </Card>

      {/* Patient Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse bg-white rounded-xl border border-slate-200 h-36" />
          ))}
        </div>
      ) : patients?.length === 0 ? (
        <Card className="text-center py-12">
          <UserCircle className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="font-semibold text-slate-500">No patients found</p>
          <Button className="mt-3" size="sm" onClick={() => setIsRegModalOpen(true)}>
            Register First Patient
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {patients?.map((patient: any) => (
            <Card
              key={patient.id}
              hoverEffect
              className="cursor-pointer min-w-0 overflow-hidden"
              onClick={() => navigate(`/patients/${patient.id}`)}
            >
              <div className="flex items-start justify-between gap-2 min-w-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 shrink-0 rounded-full bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-600 font-bold text-sm">
                    {patient.fullName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 text-sm truncate" title={patient.fullName}>{patient.fullName}</div>
                    <div className="text-[11px] font-mono text-slate-400">{patient.patientNumber}</div>
                  </div>
                </div>
                <OpenConsultationButton patientId={patient.id} />
              </div>

              <div className="mt-4 space-y-2 text-xs min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="default" size="sm">{patient.gender}</Badge>
                  {patient.age != null && <span className="text-slate-500">{patient.age} yrs</span>}
                  {patient.bloodGroup && (
                    <span className="inline-flex items-center gap-1 font-semibold text-rose-600">
                      <Droplets className="w-3 h-3" />{patient.bloodGroup}
                    </span>
                  )}
                </div>
                {patient.mobile && (
                  <a
                    href={`tel:${patient.mobile}`}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex max-w-full items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200 transition-colors"
                    title={`Call ${patient.fullName} (${patient.mobile})`}
                  >
                    <Phone className="w-3 h-3 shrink-0 text-emerald-600" />
                    <span className="truncate">{patient.mobile}</span>
                  </a>
                )}

                {patient.allergies && !/^none(?: reported)?$/i.test(patient.allergies.trim()) && (
                  <div className="flex items-start gap-1.5 min-w-0 text-amber-700" title={patient.allergies}>
                    <AlertCircle className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                    <span className="min-w-0 break-words">{patient.allergies}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-start justify-between gap-2 text-[11px] text-slate-500 min-w-0">
                <span className="min-w-0 break-words">
                  {patient.assignedDoctors?.length > 0
                    ? patient.assignedDoctors.map((d: any) => d.name).join(', ')
                    : 'No doctor assigned'}
                </span>
                <span className="shrink-0">{patient.totalVisits ?? 0} visits</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Register Patient Modal */}
      <Modal
        isOpen={isRegModalOpen}
        onClose={() => setIsRegModalOpen(false)}
        title="Register New Patient"
        description="Fill in the patient details. Duplicate check will run automatically."
        maxWidth="3xl"
      >
        <form noValidate onSubmit={handleSubmitForm} className="space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-brand-700 pb-1 border-b border-brand-100">
            Personal Information
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Full Name"
              required
              placeholder="e.g. Rahul Kumar Sharma"
              value={form.fullName}
              error={formErrors.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            />
            <Input
              label="Mobile Number"
              required
              placeholder="Up to 12 digits"
              value={form.mobile}
              error={formErrors.mobile}
              inputMode="numeric"
              maxLength={12}
              onChange={(e) => setForm({ ...form, mobile: normalizeMobileInput(e.target.value) })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select
              label="Gender"
              required
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
              options={[
                { value: 'MALE', label: 'Male' },
                { value: 'FEMALE', label: 'Female' },
                { value: 'OTHER', label: 'Other' },
              ]}
            />
            <Input
              label="Age (Years)"
              type="number"
              placeholder="e.g. 34"
              value={form.age}
              error={formErrors.age}
              min="0"
              max="150"
              onChange={(e) => setForm({ ...form, age: e.target.value })}
            />
            <Select
              label="Blood Group"
              value={form.bloodGroup}
              onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
              options={[
                { value: '', label: 'Select Blood Group' },
                ...bloodGroups.map((bg) => ({ value: bg, label: bg })),
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Email (Optional)"
              type="email"
              placeholder="patient@email.com"
              value={form.email}
              error={formErrors.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <Input
              label="Date of Birth (Optional)"
              type="date"
              value={form.dateOfBirth}
              onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
            />
          </div>

          <div className="text-xs font-bold uppercase tracking-wider text-brand-700 pb-1 border-b border-brand-100 pt-2">
            Medical Information
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Textarea
              label="Known Allergies"
              placeholder="Penicillin, Aspirin, Latex..."
              rows={2}
              value={form.allergies}
              onChange={(e) => setForm({ ...form, allergies: e.target.value })}
            />
            <Textarea
              label="Existing Illness / Conditions"
              placeholder="Diabetes Type II, Hypertension..."
              rows={2}
              value={form.existingIllness}
              onChange={(e) => setForm({ ...form, existingIllness: e.target.value })}
            />
          </div>

          {/* Doctor Assignment */}
          {doctors && doctors.length > 1 && (
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-2">
                Assign Doctor(s)
              </label>
              <div className="flex flex-wrap gap-2">
                {doctors.map((doc: any) => (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => {
                      const updated = form.doctorIds.includes(doc.id)
                        ? form.doctorIds.filter((id) => id !== doc.id)
                        : [...form.doctorIds, doc.id];
                      setForm({ ...form, doctorIds: updated });
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      form.doctorIds.includes(doc.id)
                        ? 'bg-brand-600 text-white border-brand-600'
                        : 'bg-slate-50 text-slate-700 border-slate-300 hover:border-brand-300'
                    }`}
                  >
                    {doc.name} — {doc.specialization}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Textarea
            label="Additional Notes"
            placeholder="Any other relevant clinical notes..."
            rows={2}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setIsRegModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={createPatientMutation.isPending}
            >
              {createPatientMutation.isPending ? 'Registering patient...' : 'Check & Register Patient'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Duplicate Patient Warning Modal */}
      <DuplicatePatientModal
        isOpen={isDuplicateModalOpen}
        onClose={() => setIsDuplicateModalOpen(false)}
        duplicates={duplicates}
        onForceCreate={handleForceCreate}
        isLoading={createPatientMutation.isPending}
      />
    </div>
  );
};
