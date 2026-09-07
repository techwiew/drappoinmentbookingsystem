import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client.js';
import { Card } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { Input } from "../../components/ui/Input.js";
import { Modal } from '../../components/ui/Modal.js';
import { StatusBadge, Badge } from '../../components/ui/Badge.js';
import {
  Building2,
  Search,
  Plus,
  Filter,
  CheckCircle2,
  Ban,
  Users,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

export const ClinicsManagementPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State for New Clinic Wizard
  const [formData, setFormData] = useState({
    name: "",
    address: "",
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

  const { data: clinicsData, isLoading } = useQuery({
    queryKey: ['super-admin-clinics', search, statusFilter],
    queryFn: async () => {
      const res = await apiClient.get('/super-admin/clinics', {
        params: { search, status: statusFilter },
      });
      return res.data.data;
    },
  });

  // Create Clinic Mutation
  const createClinicMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiClient.post('/super-admin/clinics', payload);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin-clinics'] });
      queryClient.invalidateQueries({ queryKey: ['super-admin-dashboard'] });
      setIsAddModalOpen(false);
      setFormData({
        name: "",
        address: "",
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
    },
  });

  // Toggle Status Mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ clinicId, status }: { clinicId: string; status: string }) => {
      const res = await apiClient.patch(`/super-admin/clinics/${clinicId}/status`, { status });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin-clinics'] });
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-indigo-600" />
            Clinic Tenants Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Provision, manage, and isolate tenant clinics across the platform.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsAddModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
          className="bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 shrink-0"
        >
          Add New Clinic
        </Button>
      </div>

      {/* Filters Bar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="w-full sm:flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search clinic by name, city, email, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-44 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="SUSPENDED">Suspended Only</option>
              <option value="TRIAL">Trial Only</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Clinics Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3.5">Clinic Name & Location</th>
                <th className="p-3.5">Slug / Token Prefix</th>
                <th className="p-3.5">Subscription Plan</th>
                <th className="p-3.5">Staff & Patients</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center p-8 text-slate-400">
                    Loading clinics...
                  </td>
                </tr>
              ) : clinicsData?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center p-8 text-slate-500">
                    No clinics found matching criteria.
                  </td>
                </tr>
              ) : (
                clinicsData?.map((clinic: any) => (
                  <tr
                    key={clinic.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900 text-sm">
                        {clinic.name}
                      </div>
                      <div className="text-slate-500 text-[11px] mt-0.5">
                        {clinic.address}, {clinic.city}, {clinic.state}
                      </div>
                      <div className="text-slate-400 text-[11px]">
                        📞 {clinic.phone} • ✉️ {clinic.email}
                      </div>
                    </td>
                    <td className="p-3.5 font-mono">
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                        {clinic.slug}
                      </span>
                      <span className="ml-1.5 text-indigo-700 font-bold bg-indigo-50 px-1.5 py-0.5 rounded">
                        {clinic.tokenPrefix}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className="font-semibold text-indigo-800 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200">
                        {clinic.subscription?.planName || "Standard"}
                      </span>
                      <div className="text-[10px] text-slate-400 mt-1">
                        Renews:{" "}
                        {clinic.subscription?.endDate
                          ? new Date(
                              clinic.subscription.endDate,
                            ).toLocaleDateString()
                          : "N/A"}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div className="text-slate-800 font-medium">
                        🩺 {clinic.doctorCount} Doctors • 🛎️{" "}
                        {clinic.receptionistCount} Staff
                      </div>
                      <div className="text-slate-500 text-[11px] mt-0.5">
                        👥 {clinic.patientCount} Registered Patients
                      </div>
                    </td>
                    <td className="p-3.5">
                      <StatusBadge status={clinic.status} size="sm" />
                    </td>
                    <td className="p-3.5 text-right space-x-1.5">
                      {clinic.status === "ACTIVE" ? (
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() =>
                            toggleStatusMutation.mutate({
                              clinicId: clinic.id,
                              status: "SUSPENDED",
                            })
                          }
                          className="text-[11px] px-2 py-1"
                        >
                          Suspend
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() =>
                            toggleStatusMutation.mutate({
                              clinicId: clinic.id,
                              status: "ACTIVE",
                            })
                          }
                          className="text-[11px] px-2 py-1"
                        >
                          Activate
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

      {/* Add New Clinic Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Provision New Clinic Tenant"
        description="Creates an isolated tenant database partition, initializes subscription, and seeds the clinic administrator."
        maxWidth="3xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-indigo-700 border-b border-indigo-100 pb-1">
            1. Clinic Information
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Clinic / Polyclinic Name"
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
              label="Phone Number"
              placeholder="+91 98200 12345"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              required
            />
            <Input
              label="Official Email"
              type="email"
              placeholder="contact@apolloclinic.com"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
            />
          </div>

          <div className="text-xs font-bold uppercase tracking-wider text-indigo-700 border-b border-indigo-100 pb-1 pt-2">
            2. Initial Administrator & Doctor Account
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Doctor / Admin Name"
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
              placeholder="dr.rajesh@apolloclinic.com"
              value={formData.adminEmail}
              onChange={(e) =>
                setFormData({ ...formData, adminEmail: e.target.value })
              }
              required
            />
            <Input
              label="Initial Password"
              type="text"
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
              label="Registration #"
              placeholder="MCI-2018-991"
              value={formData.registrationNumber}
              onChange={(e) =>
                setFormData({ ...formData, registrationNumber: e.target.value })
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

          <div className="text-xs font-bold uppercase tracking-wider text-indigo-700 border-b border-indigo-100 pb-1 pt-2">
            3. Subscription
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Plan Price (₹ / month)"
              type="number"
              min="0"
              step="0.01"
              value={formData.planPrice}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  planPrice: parseFloat(e.target.value) || 0,
                })
              }
              required
            />
            <Input
              label="Active For (months)"
              type="number"
              min="1"
              step="1"
              value={formData.activeMonths}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  activeMonths: parseInt(e.target.value, 10) || 1,
                })
              }
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              variant="secondary"
              type="button"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              isLoading={createClinicMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/30"
            >
              Provision Clinic & Create Admin
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
