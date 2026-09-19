import React, { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, HeartPulse, KeyRound, Mail } from 'lucide-react';
import { apiClient } from '../../api/client.js';
import { getApiErrorMessage } from '../../api/errors.js';

export const PasswordResetPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(''); setMessage(''); setIsLoading(true);
    try {
      await apiClient.post('/auth/verify-and-change-password', {
        email,
        mobile,
        oldPassword,
        newPassword
      });
      setMessage('Your password has been changed successfully. You can now sign in with your new password.');
      // Clear form for security
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to continue. Please try again.'));
    } finally { setIsLoading(false); }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-12 text-slate-900">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-6 flex items-center justify-between">
          <Link to="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-teal-700 hover:text-teal-800">
            <img src="/Medinovel_logo.png" alt="" className="brand-logo h-6 w-6 rounded object-contain" /> MediNovel
          </Link>
          <Link to="/login" className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In
          </Link>
        </div>
        <section className="border border-slate-200 bg-white p-6 shadow-sm sm:p-8 rounded-xl">
          <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
            <Mail className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Change your password</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Verify your identity and change your password securely.
          </p>
          {error && <p className="mt-5 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
          {message && <div className="mt-5 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800"><CheckCircle2 className="mr-2 inline h-4 w-4" />{message}</div>}
          {!message ? <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block text-sm font-semibold">
              Email address
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              />
            </label>
            <label className="block text-sm font-semibold">
              Mobile number
              <input
                required
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              />
            </label>
            <label className="block text-sm font-semibold">
              Old password
              <input
                required
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              />
            </label>
            <label className="block text-sm font-semibold">
              New password
              <input
                required
                minLength={6}
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              />
            </label>
            <label className="block text-sm font-semibold">
              Confirm new password
              <input
                required
                minLength={6}
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              />
            </label>
            <button
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-3 text-sm font-bold text-white hover:bg-teal-800 disabled:opacity-70"
            >
              {isLoading ? 'Please wait...' : 'Change password'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form> : null}
          {message && <Link to="/login" className="mt-6 inline-flex text-sm font-semibold text-teal-700 hover:underline">Return to sign in</Link>}
        </section>
      </div>
    </main>
  );
};
