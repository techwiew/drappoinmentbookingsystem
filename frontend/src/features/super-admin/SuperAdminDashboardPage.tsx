import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../api/client.js";
import { Card, StatCard } from "../../components/ui/Card.js";
import { StatusBadge } from "../../components/ui/Badge.js";
import { Button } from "../../components/ui/Button.js";
import { Modal } from "../../components/ui/Modal.js";
import { Input } from "../../components/ui/Input.js";
import {
  Building2,
  Users,
  TrendingUp,
  Plus,
  ArrowRight,
  ShieldCheck,
  Activity,
  Stethoscope,
  CheckCircle2,
  Copy,
  ClipboardCheck,
  KeyRound,
  ArrowRightCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export const SuperAdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [copiedField, setCopiedField] = useState("");
  const [createdClinic, setCreatedClinic] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: "",
    address: "Main Road",
    phone: "",
    email: "",
    city: "",
    state: "",
    pincode: "",
    planPrice: 0,
    activeMonths: 1,
    adminName: "",
    adminEmail: "",
    adminPassword: "Doctor@123",
    adminMobile: "",
    specialization: "General Medicine",
    qualification: "MBBS",
    registrationNumber: "REG-1001",
    consultationFee: 500,
  });

  const { data: stats, isLoading } = useQuery({
    queryKey: ["super-admin-dashboard"],
    queryFn: async () => {
      const res = await apiClient.get("/super-admin/dashboard");
      return res.data.data;
    },
  });

  const { data: plans } = useQuery({
    queryKey: ["super-admin-plans"],
    queryFn: async () => {
      const res = await apiClient.get("/super-admin/plans");
      return res.data.data;
    },
  });

  const createClinicMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiClient.post("/super-admin/clinics", payload);
      return res.data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["super-admin-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["super-admin-clinics"] });
      setCreatedClinic(data);
    },
  });

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData((prev) => ({
      ...prev,
      name,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createClinicMutation.mutate({
      ...formData,
    });
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(""), 2000);
  };

  const resetAndClose = () => {
    setIsAddModalOpen(false);
    setCreatedClinic(null);
    setFormData({
      name: "",
      address: "Main Road",
      phone: "",
      email: "",
      city: "",
      state: "",
      pincode: "",
      planPrice: 0,
      activeMonths: 1,
      adminName: "",
      adminEmail: "",
      adminPassword: "Doctor@123",
      adminMobile: "",
      specialization: "General Medicine",
      qualification: "MBBS",
      registrationNumber: "REG-1001",
      consultationFee: 500,
    });
  };

  const metrics = stats?.metrics;

  return (
    <div className="space-y-6">
      {/* ── Hero Banner with primary CTA ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 rounded-2xl text-white shadow-xl">
        {/* Ambient glow */}
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="p-1.5 bg-indigo-600 rounded-lg">
                <ShieldCheck className="w-5 h-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                Super Admin Console
              </h1>
            </div>
            <p className="text-sm text-slate-300 max-w-lg">
              Provision new clinic tenants, manage subscriptions, and monitor
              the platform in real-time.
            </p>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="group flex items-center gap-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-3.5 rounded-xl shadow-lg shadow-indigo-900/40 transition-all duration-200 shrink-0 text-sm"
          >
            <Plus className="w-5 h-5" />
            Add New Clinic
            <ArrowRightCircle className="w-4 h-4 opacity-70 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Step guide */}
        <div className="relative z-10 mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              step: "1",
              icon: "🏥",
              title: "Create Clinic",
              desc: "Add clinic details and assign subscription tier",
            },
            {
              step: "2",
              icon: "🩺",
              title: "Doctor Logs In",
              desc: "Doctor uses the credentials you set to sign in",
            },
            {
              step: "3",
              icon: "👥",
              title: "Start Seeing Patients",
              desc: "Register patients, book appointments & manage queue",
            },
          ].map((s) => (
            <div
              key={s.step}
              className="flex items-start gap-3 bg-white/5 border border-white/10 rounded-xl p-3.5"
            >
              <span className="w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-extrabold flex items-center justify-center shrink-0">
                {s.step}
              </span>
              <div>
                <div className="text-sm font-bold text-white">
                  {s.icon} {s.title}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                  {s.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── KPI Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Clinics"
          value={isLoading ? "..." : metrics?.totalClinics || 0}
          subtitle={`${metrics?.activeClinics || 0} Active`}
          icon={<Building2 className="w-5 h-5" />}
          iconBgColor="bg-indigo-50 text-indigo-600"
        />
        <StatCard
          title="Monthly Revenue"
          value={isLoading ? "..." : `₹${(metrics?.mrr || 0).toLocaleString()}`}
          subtitle="MRR"
          icon={<TrendingUp className="w-5 h-5" />}
          iconBgColor="bg-emerald-50 text-emerald-600"
          trend={{ value: "12.4%", isPositive: true }}
        />
        <StatCard
          title="Total Doctors"
          value={isLoading ? "..." : metrics?.totalDoctors || 0}
          subtitle="Across all clinics"
          icon={<Users className="w-5 h-5" />}
          iconBgColor="bg-brand-50 text-brand-600"
        />
        <StatCard
          title="Total Patients"
          value={isLoading ? "..." : metrics?.totalPatients || 0}
          subtitle={`${metrics?.totalAppointments || 0} Visits`}
          icon={<Activity className="w-5 h-5" />}
          iconBgColor="bg-sky-50 text-sky-600"
        />
      </div>

      {/* ── Clinics Table + Plans ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Clinic Tenants
                </h2>
                <p className="text-xs text-slate-500">
                  Live tenant status and subscriber details
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/super-admin/clinics")}
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                View All
              </Button>
            </div>

            {!stats?.recentClinics || stats.recentClinics.length === 0 ? (
              <div className="text-center py-10">
                <Building2 className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-400">
                  No clinics yet
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Click <strong>"Add New Clinic"</strong> above to provision
                  your first clinic tenant.
                </p>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="mt-4 inline-flex items-center gap-2 bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Add First Clinic
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Clinic Name</th>
                      <th className="p-3">City</th>
                      <th className="p-3">Plan</th>
                      <th className="p-3">Staff</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stats?.recentClinics?.map((c: any) => (
                      <tr
                        key={c.id}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="p-3">
                          <div className="font-bold text-slate-900">
                            {c.name}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            slug: {c.slug}
                          </div>
                        </td>
                        <td className="p-3 text-slate-600">{c.city}</td>
                        <td className="p-3">
                          <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                            {c.planName}
                          </span>
                        </td>
                        <td className="p-3 font-semibold text-slate-800">
                          {c.doctorCount} Doctors
                        </td>
                        <td className="p-3">
                          <StatusBadge status={c.status} size="sm" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <div className="border-b border-slate-100 pb-3 mb-4">
              <h2 className="text-base font-bold text-slate-900">
                Subscription Plans
              </h2>
              <p className="text-xs text-slate-500">
                Active tenant distribution by tier
              </p>
            </div>
            <div className="space-y-3">
              {stats?.planDistribution?.map((p: any) => (
                <div
                  key={p.code}
                  className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-slate-900 text-sm">
                      {p.planName}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      ₹{p.price.toLocaleString()} / mo
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black text-indigo-600">
                      {p.count}
                    </span>
                    <span className="text-[11px] text-slate-400 block">
                      Clinics
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-4"
              onClick={() => navigate("/super-admin/plans")}
            >
              Manage Plans
            </Button>
          </Card>

          {/* Super Admin credentials card */}
          <Card className="bg-slate-900 text-white border-slate-700">
            <div className="flex items-center gap-2 mb-3">
              <KeyRound className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">
                Your Admin Credentials
              </h3>
            </div>
            <div className="space-y-2 text-xs">
              {[
                { label: "Email", value: "admin@medinodes.com" },
                { label: "Password", value: "Admin@123" },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg px-3 py-2"
                >
                  <div>
                    <div className="text-slate-400 text-[10px]">{label}</div>
                    <div className="text-white font-mono font-semibold">
                      {value}
                    </div>
                  </div>
                  <button
                    onClick={() => handleCopy(value, label)}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    {copiedField === label ? (
                      <ClipboardCheck className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* ── Add Clinic Modal ── */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={resetAndClose}
        title={
          createdClinic
            ? "✅ Clinic Provisioned Successfully!"
            : "🏥 Add New Clinic Tenant"
        }
        description={
          createdClinic
            ? "Your clinic is live. Share these credentials with the doctor."
            : "Creates a tenant, initializes subscription, and sets up the first doctor account."
        }
        maxWidth="3xl"
      >
        {createdClinic ? (
          /* ── Success screen with copy-able credentials ── */
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-emerald-900 text-sm">
                  {createdClinic.clinicName || formData.name} is now live!
                </div>
                <div className="text-xs text-emerald-700 mt-0.5">
                  Tenant partition created, subscription activated, and doctor
                  account seeded.
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-900 rounded-xl border border-slate-700 space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <Stethoscope className="w-4 h-4 text-brand-400" />
                <span className="text-sm font-bold text-white">
                  Doctor Login Credentials
                </span>
                <span className="text-[10px] text-slate-400 ml-auto">
                  Share these with the doctor
                </span>
              </div>
              {[
                {
                  label: "Login URL",
                  value: window.location.origin + "/login",
                },
                { label: "Email", value: formData.adminEmail },
                { label: "Password", value: formData.adminPassword },
                { label: "Clinic Slug", value: createdClinic.slug },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg px-3 py-2"
                >
                  <div>
                    <div className="text-[10px] text-slate-400">{label}</div>
                    <div className="text-white font-mono text-xs font-semibold break-all">
                      {value}
                    </div>
                  </div>
                  <button
                    onClick={() => handleCopy(value, label)}
                    className="ml-3 shrink-0 text-slate-400 hover:text-white transition-colors"
                  >
                    {copiedField === label ? (
                      <ClipboardCheck className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-2 justify-end">
              <Button variant="secondary" onClick={resetAndClose}>
                Close
              </Button>
              <Button
                variant="primary"
                className="bg-indigo-600 hover:bg-indigo-700"
                onClick={() => {
                  resetAndClose();
                  navigate("/super-admin/clinics");
                }}
              >
                View All Clinics
              </Button>
            </div>
          </div>
        ) : (
          /* ── Create Clinic Form ── */
          <form onSubmit={handleSubmit} className="space-y-4">
            {createClinicMutation.isError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                {(createClinicMutation.error as any)?.response?.data?.error
                  ?.message || "Failed to create clinic. Please try again."}
              </div>
            )}

            <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 border-b border-indigo-100 pb-1">
              1. Clinic Details
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Clinic Name"
                placeholder="e.g. Apollo Care Center"
                value={formData.name}
                onChange={handleNameChange}
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="City"
                placeholder="Mumbai"
                value={formData.city}
                onChange={(e) =>
                  setFormData({ ...formData, city: e.target.value })
                }
                required
              />
              <Input
                label="State"
                placeholder="Maharashtra"
                value={formData.state}
                onChange={(e) =>
                  setFormData({ ...formData, state: e.target.value })
                }
                required
              />
              <Input
                label="Pincode"
                placeholder="400050"
                value={formData.pincode}
                onChange={(e) =>
                  setFormData({ ...formData, pincode: e.target.value })
                }
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="Phone"
                placeholder="+91 98200 12345"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                required
              />
              <Input
                label="Email"
                type="email"
                placeholder="contact@apollo.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </div>

            <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 border-b border-indigo-100 pb-1 pt-1">
              2. First Doctor Account (Owner)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Doctor Full Name"
                placeholder="Dr. Rajesh Gupta"
                value={formData.adminName}
                onChange={(e) =>
                  setFormData({ ...formData, adminName: e.target.value })
                }
                required
              />
              <Input
                label="Doctor Mobile"
                placeholder="9820099887"
                value={formData.adminMobile}
                onChange={(e) =>
                  setFormData({ ...formData, adminMobile: e.target.value })
                }
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Doctor Login Email"
                type="email"
                placeholder="dr.rajesh@apollo.com"
                value={formData.adminEmail}
                onChange={(e) =>
                  setFormData({ ...formData, adminEmail: e.target.value })
                }
                required
              />
              <Input
                label="Doctor Password"
                value={formData.adminPassword}
                onChange={(e) =>
                  setFormData({ ...formData, adminPassword: e.target.value })
                }
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="Specialization"
                placeholder="Cardiology"
                value={formData.specialization}
                onChange={(e) =>
                  setFormData({ ...formData, specialization: e.target.value })
                }
              />
              <Input
                label="Reg. Number"
                placeholder="MCI-2018-991"
                value={formData.registrationNumber}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    registrationNumber: e.target.value,
                  })
                }
              />
              <Input
                label="Consultation Fee (₹)"
                type="number"
                value={formData.consultationFee}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    consultationFee: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>

            <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 border-b border-indigo-100 pb-1 pt-1">
              3. Subscription
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Plan Price (₹ / month)"
                type="number"
                min="0"
                step="0.01"
                value={formData.planPrice}
                onChange={(e) => setFormData({ ...formData, planPrice: parseFloat(e.target.value) || 0 })}
                required
              />
              <Input
                label="Active For (months)"
                type="number"
                min="1"
                step="1"
                value={formData.activeMonths}
                onChange={(e) => setFormData({ ...formData, activeMonths: parseInt(e.target.value, 10) || 1 })}
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
              <Button variant="secondary" type="button" onClick={resetAndClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                isLoading={createClinicMutation.isPending}
                className="bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/30"
              >
                Provision Clinic & Create Doctor
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
