import React, { FormEvent, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, CheckCircle2, HeartPulse, KeyRound, Mail } from 'lucide-react';
import { apiClient } from '../../api/client.js';

export const PasswordResetPage: React.FC<{ mode: 'request' | 'reset' }> = ({ mode }) => {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [resetUrl, setResetUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const token = searchParams.get('token') || '';

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(''); setMessage(''); setIsLoading(true);
    try {
      if (mode === 'request') {
        const response = await apiClient.post('/auth/forgot-password', { email });
        setMessage('If an account exists, a reset link has been created.');
        setResetUrl(response.data.data?.resetUrl || '');
      } else {
        if (!token) throw new Error('This password reset link is invalid.');
        if (password !== confirmPassword) throw new Error('Passwords do not match.');
        await apiClient.post('/auth/reset-password', { token, newPassword: password });
        setMessage('Your password has been reset. You can now sign in.');
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || 'Unable to continue. Please try again.');
    } finally { setIsLoading(false); }
  };

  const isRequest = mode === 'request';
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-12 text-slate-900">
      <div className="mx-auto w-full max-w-md">
        <Link to="/login" className="mb-10 inline-flex items-center gap-2 text-sm font-semibold text-teal-700 hover:text-teal-800">
          <HeartPulse className="h-5 w-5" /> MediNovel
        </Link>
        <section className="border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
            {isRequest ? <Mail className="h-5 w-5" /> : <KeyRound className="h-5 w-5" />}
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{isRequest ? 'Reset your password' : 'Choose a new password'}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {isRequest ? 'Enter your email and we will create a secure reset link.' : 'Your new password must be at least 6 characters long.'}
          </p>
          {error && <p className="mt-5 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
          {message && <div className="mt-5 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800"><CheckCircle2 className="mr-2 inline h-4 w-4" />{message}</div>}
          {resetUrl && <a href={resetUrl} className="mt-4 block break-all rounded-lg border border-teal-200 bg-teal-50 p-3 text-xs font-semibold text-teal-800 hover:bg-teal-100">Open local reset link</a>}
          {!message ? <form onSubmit={submit} className="mt-6 space-y-4">
            {isRequest ? <label className="block text-sm font-semibold">Email address<input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100" /></label> : <>
              <label className="block text-sm font-semibold">New password<input required minLength={6} type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100" /></label>
              <label className="block text-sm font-semibold">Confirm new password<input required minLength={6} type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100" /></label>
            </>}
            <button disabled={isLoading} className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-3 text-sm font-bold text-white hover:bg-teal-800 disabled:opacity-70">{isLoading ? 'Please wait...' : isRequest ? 'Create reset link' : 'Reset password'}<ArrowRight className="h-4 w-4" /></button>
          </form> : null}
          {message && !isRequest && <Link to="/login" className="mt-6 inline-flex text-sm font-semibold text-teal-700 hover:underline">Return to sign in</Link>}
        </section>
      </div>
    </main>
  );
};
