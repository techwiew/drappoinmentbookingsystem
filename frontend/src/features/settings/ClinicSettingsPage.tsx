import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.js';
import { Card } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { Input } from '../../components/ui/Input.js';
import { Textarea } from '../../components/ui/Textarea.js';
import { Badge } from '../../components/ui/Badge.js';
import { getApiErrorMessage } from '../../api/errors.js';
import {
  Settings,
  Building2,
  CheckCircle2,
  ShieldCheck,
  CreditCard,
  Save,
} from 'lucide-react';

export const ClinicSettingsPage: React.FC = () => {
  const { refreshProfile } = useAuth();
  const queryClient = useQueryClient();

  const { data: clinic, isLoading } = useQuery({
    queryKey: ['my-clinic'],
    queryFn: async () => {
      const res = await apiClient.get('/clinics/profile');
      return res.data.data;
    },
  });

  const { data: subscription } = useQuery({
    queryKey: ['my-subscription'],
    queryFn: async () => {
      const res = await apiClient.get('/subscriptions/current');
      return res.data.data?.subscription;
    },
  });

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    tokenPrefix: '',
  });
  const [isSaved, setIsSaved] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);

  React.useEffect(() => {
    if (clinic) {
      setForm({
        name: clinic.name || '',
        phone: clinic.phone || '',
        email: clinic.email || '',
        address: clinic.address || '',
        city: clinic.city || '',
        state: clinic.state || '',
        pincode: clinic.pincode || '',
        tokenPrefix: clinic.tokenPrefix || 'TKN',
      });
    }
  }, [clinic]);

  const updateMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiClient.patch('/clinics/profile', payload);
      return res.data.data;
    },
    onSuccess: async (updated) => {
      queryClient.setQueryData(['my-clinic'], updated);
      await refreshProfile();
      await queryClient.invalidateQueries({ queryKey: ['my-clinic'] });
      await queryClient.invalidateQueries({ queryKey: ['my-subscription'] });
      setMessage(null);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    },
    onError: (error) => setMessage(getApiErrorMessage(error, 'Unable to save clinic settings. Please try again.')),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (form.name.trim().length < 2) nextErrors.name = 'Enter the clinic name (at least 2 characters).';
    if (!/^\d{1,12}$/.test(form.phone)) nextErrors.phone = 'Enter up to 12 digits.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) nextErrors.email = 'Enter a valid email address.';
    if (form.address.trim().length < 5) nextErrors.address = 'Enter a complete clinic address.';
    if (form.city.trim().length < 2) nextErrors.city = 'Enter a valid city name.';
    if (form.state.trim().length < 2) nextErrors.state = 'Enter a valid state name.';
    if (!/^\d{6}$/.test(form.pincode)) nextErrors.pincode = 'Pincode must contain exactly 6 digits.';
    if (!/^[A-Z0-9]{1,5}$/.test(form.tokenPrefix)) nextErrors.tokenPrefix = 'Use 1-5 uppercase letters or digits.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) { setMessage('Please correct the highlighted fields.'); return; }
    setMessage(null);
    updateMutation.mutate({ ...form, name: form.name.trim(), email: form.email.trim().toLowerCase(), address: form.address.trim(), city: form.city.trim(), state: form.state.trim() });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-brand-600" />
          Clinic Settings & Configuration
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Manage clinic letterhead, token prefix, contact details, and
          subscription tier
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Form */}
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
              <Building2 className="w-4 h-4 text-brand-600" />
              <h2 className="text-sm font-bold text-slate-900">
                Clinic Profile & Letterhead
              </h2>
            </div>

            {isSaved && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Clinic settings successfully updated!</span>
              </div>
            )}

            {message && <div role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-800">{message}</div>}
            <form noValidate onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Clinic Name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  error={errors.name}
                />
                <Input
                  label="Queue Token Prefix"
                  value={form.tokenPrefix}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      tokenPrefix: e.target.value.toUpperCase(),
                    })
                  }
                  maxLength={5}
                  required
                  error={errors.tokenPrefix}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Contact Phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 12) })}
                  required
                  inputMode="numeric"
                  maxLength={12}
                  error={errors.phone}
                />
                <Input
                  label="Official Email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  error={errors.email}
                />
              </div>

              <Textarea
                label="Clinic Address"
                rows={2}
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                required
                error={errors.address}
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input
                  label="City"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  required
                  error={errors.city}
                />
                <Input
                  label="State"
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  required
                  error={errors.state}
                />
                <Input
                  label="Pincode"
                  value={form.pincode}
                  onChange={(e) =>
                    setForm({ ...form, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })
                  }
                  required
                  inputMode="numeric"
                  maxLength={6}
                  error={errors.pincode}
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={updateMutation.isPending}
                  leftIcon={<Save className="w-4 h-4" />}
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Right Col: Subscription Status */}
        <div className="space-y-4">
          <Card>
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
              <CreditCard className="w-4 h-4 text-brand-600" />
              <h2 className="text-sm font-bold text-slate-900">
                Current Subscription
              </h2>
            </div>

            {subscription ? (
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-brand-50 rounded-xl border border-brand-100">
                  <div className="text-base font-extrabold text-brand-900">
                    {subscription.planName} Tier
                  </div>
                  <div className="text-brand-600 mt-0.5">
                    ₹{subscription.price?.toLocaleString()} / month
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Status:</span>
                    <Badge variant="success" size="sm">
                      Active
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Billing Cycle:</span>
                    <span className="font-semibold text-slate-800">
                      {subscription.billingCycle}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Renewal Date:</span>
                    <span className="font-semibold text-slate-800">
                      {subscription.endDate
                        ? new Date(subscription.endDate).toLocaleDateString()
                        : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Quota:</span>
                    <span className="font-semibold text-slate-800">
                      Max {subscription.maxDoctors} Doctors •{" "}
                      {subscription.maxReceptionists} Staff
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500">
                Clinic active under Standard Multi-Tenant License.
              </div>
            )}
          </Card>

          <Card className="bg-slate-900 text-white border-slate-800">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Data Isolation Guard
              </h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your clinic records, consultations, and patient history are
              cryptographically isolated in your dedicated tenant partition.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};
