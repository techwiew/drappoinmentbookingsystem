import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.js';
import { Card } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { Badge, StatusBadge } from "../../components/ui/Badge.js";
import {
  ArrowLeft,
  Phone,
  Mail,
  Droplets,
  AlertCircle,
  Stethoscope,
  FileText,
  CreditCard,
  Calendar,
  Clock,
} from "lucide-react";

export const PatientProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { doctorId, role } = useAuth();
  const [activeTab, setActiveTab] = useState<
    "overview" | "consultations" | "prescriptions" | "billing"
  >("overview");
  const [isOpeningConsultation, setIsOpeningConsultation] = useState(false);

  const { data: patient, isLoading } = useQuery({
    queryKey: ["patient", id],
    queryFn: async () => {
      const res = await apiClient.get(`/patients/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });

  const { data: consultations } = useQuery({
    queryKey: ["patient-consultations", id],
    queryFn: async () => {
      const res = await apiClient.get(`/consultations?patientId=${id}`);
      return res.data.data;
    },
    enabled: !!id && activeTab === "consultations",
  });

  const { data: payments } = useQuery({
    queryKey: ["patient-payments", id],
    queryFn: async () => {
      const res = await apiClient.get(`/payments?patientId=${id}`);
      return res.data.data;
    },
    enabled: !!id && activeTab === "billing",
  });

  const handleOpenConsultation = async () => {
    if (!id) return;

    try {
      setIsOpeningConsultation(true);
      const res = await apiClient.post("/consultations/open", {
        patientId: id,
        doctorId: doctorId || undefined,
      });
      const { appointmentId } = res.data.data;
      navigate(`/queue/${appointmentId}/consult`);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        "Unable to open consultation for this patient.";
      window.alert(message);
    } finally {
      setIsOpeningConsultation(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse h-10 bg-slate-200 rounded-xl w-1/3" />
        <div className="animate-pulse h-48 bg-slate-100 rounded-2xl" />
      </div>
    );
  }

  if (!patient) {
    return (
      <Card className="text-center py-12">
        <p className="text-slate-500">Patient not found</p>
        <Button
          className="mt-3"
          size="sm"
          onClick={() => navigate("/patients")}
        >
          Back to Patients
        </Button>
      </Card>
    );
  }

  const tabs = [
    { id: "overview", label: "Overview", icon: Stethoscope },
    { id: "consultations", label: "Consultations", icon: FileText },
    { id: "billing", label: "Billing History", icon: CreditCard },
  ] as const;

  return (
    <div className="space-y-5">
      {/* Top Navigation */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/patients")}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
        >
          Back to Patients
        </Button>
        <span className="text-slate-300">/</span>
        <span className="text-sm text-slate-600 font-medium">
          {patient.fullName}
        </span>
      </div>

      {/* Patient Header Card */}
      <Card className="bg-gradient-to-r from-slate-900 to-slate-800 text-white border-slate-700">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 text-white flex items-center justify-center text-2xl font-black shadow-lg">
              {patient.fullName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-black tracking-tight">
                  {patient.fullName}
                </h1>
                <span className="text-xs font-mono bg-white/10 text-slate-300 px-2 py-0.5 rounded">
                  {patient.patientNumber}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-300">
                <span>{patient.gender}</span>
                {patient.age && <span>• {patient.age} yrs</span>}
                {patient.dateOfBirth && (
                  <span>
                    • DOB: {new Date(patient.dateOfBirth).toLocaleDateString()}
                  </span>
                )}
                {patient.bloodGroup && (
                  <span className="flex items-center gap-1 text-rose-300 font-semibold">
                    <Droplets className="w-3 h-3" /> {patient.bloodGroup}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-400">
                {patient.mobile && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3" /> {patient.mobile}
                  </span>
                )}
                {patient.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3" /> {patient.email}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2 shrink-0">
            {(role === "DOCTOR" || role === "RECEPTIONIST") && (
              <Button
                size="sm"
                className="bg-brand-500 text-white hover:bg-brand-400 border border-brand-400"
                variant="primary"
                isLoading={isOpeningConsultation}
                onClick={handleOpenConsultation}
                leftIcon={<Stethoscope className="w-3.5 h-3.5" />}
              >
                Open Consultation
              </Button>
            )}
            <Button
              size="sm"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              variant="secondary"
              onClick={() => navigate(`/appointments?patientId=${patient.id}`)}
              leftIcon={<Calendar className="w-3.5 h-3.5" />}
            >
              Book Appointment
            </Button>
          </div>
        </div>

        {/* Medical Alerts */}
        {(patient.allergies || patient.existingIllness) && (
          <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {patient.allergies && patient.allergies !== "None" && (
              <div className="flex items-start gap-2 p-2.5 bg-rose-500/10 border border-rose-400/20 rounded-lg">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <div className="font-semibold text-rose-300 mb-0.5">
                    ⚠️ Known Allergies
                  </div>
                  <div className="text-rose-200">{patient.allergies}</div>
                </div>
              </div>
            )}
            {patient.existingIllness && (
              <div className="p-2.5 bg-amber-500/10 border border-amber-400/20 rounded-lg text-xs">
                <div className="font-semibold text-amber-300 mb-0.5">
                  🩺 Existing Conditions
                </div>
                <div className="text-amber-200">{patient.existingIllness}</div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-1 bg-slate-100/80 p-1 rounded-xl">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <h3 className="text-sm font-bold text-slate-900 mb-3">
              Assigned Doctors
            </h3>
            {patient.assignedDoctors?.length > 0 ? (
              <div className="space-y-2.5">
                {patient.assignedDoctors.map((doc: any) => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-lg border border-slate-200"
                  >
                    <div className="w-8 h-8 rounded-full bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-600 font-bold text-xs">
                      {doc.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">
                        {doc.name}
                      </div>
                      <div className="text-xs text-slate-500">
                        {doc.specialization}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">No doctors assigned</p>
            )}
          </Card>

          <Card>
            <h3 className="text-sm font-bold text-slate-900 mb-3">
              Visit Statistics
            </h3>
            <div className="space-y-2.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Total Visits</span>
                <span className="font-bold text-slate-900">
                  {patient.totalVisits ?? 0}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Total Consultations</span>
                <span className="font-bold text-slate-900">
                  {patient.totalConsultations ?? 0}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Registered On</span>
                <span className="font-bold text-slate-900">
                  {new Date(patient.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === "consultations" && (
        <div className="space-y-3">
          {!consultations?.length ? (
            <Card className="text-center py-8">
              <p className="text-slate-400 text-sm">
                No consultations recorded yet
              </p>
            </Card>
          ) : (
            consultations.map((c: any) => (
              <Card key={c.id} className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">
                        {c.diagnosis}
                      </span>
                      <StatusBadge status={c.status} size="sm" />
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      {new Date(c.createdAt).toLocaleString()} • Dr.{" "}
                      {c.doctorName}
                    </div>
                  </div>
                </div>

                {c.chiefComplaint && (
                  <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg">
                    <span className="font-semibold">Chief Complaint: </span>
                    {c.chiefComplaint}
                  </div>
                )}

                {c.prescription?.items?.length > 0 && (
                  <div className="text-xs">
                    <div className="font-semibold text-slate-700 mb-1.5">
                      Prescribed Medicines:
                    </div>
                    <div className="space-y-1">
                      {c.prescription.items.map((item: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 text-slate-600"
                        >
                          <span className="w-4 h-4 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-[9px] font-bold shrink-0">
                            {idx + 1}
                          </span>
                          <span className="font-semibold text-slate-800">
                            {item.medicineName}
                          </span>
                          <span className="text-slate-400">•</span>
                          <span className="font-mono text-brand-700">
                            {item.frequency}
                          </span>
                          <span>for {item.duration}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      )}

      {activeTab === "billing" && (
        <div className="space-y-3">
          {!payments?.length ? (
            <Card className="text-center py-8">
              <p className="text-slate-400 text-sm">No payment history</p>
            </Card>
          ) : (
            payments.map((pay: any) => (
              <Card key={pay.id} className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-slate-900">
                    ₹{pay.totalAmount?.toFixed(2)}
                    <StatusBadge
                      status={pay.paymentStatus}
                      size="sm"
                      className="ml-2"
                    />
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {pay.paymentMethod} •{" "}
                    {new Date(pay.createdAt).toLocaleDateString()}
                    {pay.transactionReference &&
                      ` • Ref: ${pay.transactionReference}`}
                  </div>
                </div>
                <div className="text-right text-xs">
                  <div className="text-slate-500">
                    Paid:{" "}
                    <span className="font-bold text-emerald-700">
                      ₹{pay.paidAmount?.toFixed(2)}
                    </span>
                  </div>
                  {pay.pendingAmount > 0 && (
                    <div className="text-rose-600 font-semibold">
                      Due: ₹{pay.pendingAmount?.toFixed(2)}
                    </div>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
};
