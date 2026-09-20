import React, { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, KeyRound, LockKeyhole, Mail } from 'lucide-react';
import { apiClient } from '../../api/client.js';
import { getApiErrorMessage } from '../../api/errors.js';

type Step = 'email' | 'otp' | 'password';

export const PasswordResetPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendOtp = async (event: FormEvent) => {
    event.preventDefault(); setError(''); setIsLoading(true);
    try { await apiClient.post('/auth/forgot-password', { email }); setStep('otp'); }
    catch (err) { setError(getApiErrorMessage(err, 'Unable to send a verification code. Please try again.')); }
    finally { setIsLoading(false); }
  };
  const verifyOtp = async (event: FormEvent) => {
    event.preventDefault(); setError(''); setIsLoading(true);
    try { const response = await apiClient.post('/auth/verify-reset-otp', { email, otp }); setResetToken(response.data.data.resetToken); setStep('password'); }
    catch (err) { setError(getApiErrorMessage(err, 'Unable to verify the code.')); }
    finally { setIsLoading(false); }
  };
  const setPassword = async (event: FormEvent) => {
    event.preventDefault();
    if (newPassword !== confirmPassword) { setError('New password and confirm password must match.'); return; }
    setError(''); setIsLoading(true);
    try { await apiClient.post('/auth/reset-password', { token: resetToken, newPassword }); navigate('/login', { replace: true }); }
    catch (err) { setError(getApiErrorMessage(err, 'Unable to reset your password.')); }
    finally { setIsLoading(false); }
  };
  const passwordField = (label: string, value: string, onChange: (value: string) => void, visible: boolean, setVisible: (visible: boolean) => void) => (
    <label className="block text-sm font-semibold">{label}<div className="relative mt-1.5"><LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input required minLength={6} type={visible ? 'text' : 'password'} autoComplete="new-password" value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-11 font-normal outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100" /><button type="button" onClick={() => setVisible(!visible)} aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`} className="absolute right-0 top-0 flex h-full items-center px-3 text-slate-500 hover:text-slate-800">{visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></label>
  );
  return <main className="min-h-screen bg-slate-50 px-5 py-12 text-slate-900"><div className="mx-auto w-full max-w-md"><div className="mb-6 flex items-center justify-between"><Link to="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-teal-700"><img src="/Medinovel_logo.png" alt="" className="brand-logo h-6 w-6 rounded object-contain" /> MediNovel</Link><Link to="/login" className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800"><ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In</Link></div><section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><div className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-700">{step === 'password' ? <LockKeyhole className="h-5 w-5" /> : step === 'otp' ? <KeyRound className="h-5 w-5" /> : <Mail className="h-5 w-5" />}</div><h1 className="text-2xl font-bold tracking-tight">{step === 'email' ? 'Reset your password' : step === 'otp' ? 'Verify your email' : 'Choose a new password'}</h1>{step === 'email' && <p className="mt-2 text-sm leading-6 text-slate-500">Enter the email address registered with MediNovel.</p>}{step === 'otp' && <div className="mt-4 rounded-lg border border-teal-200 bg-teal-50 p-3 text-sm leading-6 text-teal-900"><b>Check your email.</b> We sent a six-digit code to <b>{email}</b>. If it is not in your inbox, please check your Spam folder. The code expires in 10 minutes.</div>}{step === 'password' && <p className="mt-2 text-sm leading-6 text-slate-500">Your email is verified. Create a new password for your account.</p>}{error && <p role="alert" className="mt-5 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}{step === 'email' && <form onSubmit={sendOtp} className="mt-6 space-y-4"><label className="block text-sm font-semibold">Email address<div className="relative mt-1.5"><Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 font-normal outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100" /></div></label><button disabled={isLoading} className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-3 text-sm font-bold text-white hover:bg-teal-800 disabled:opacity-70">{isLoading ? 'Sending code...' : 'Send verification code'} <ArrowRight className="h-4 w-4" /></button></form>}{step === 'otp' && <form onSubmit={verifyOtp} className="mt-6 space-y-4"><label className="block text-sm font-semibold">Six-digit verification code<input required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="one-time-code" value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-center text-xl font-bold tracking-[0.45em] outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100" /></label><button disabled={isLoading || otp.length !== 6} className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-3 text-sm font-bold text-white hover:bg-teal-800 disabled:opacity-70">{isLoading ? 'Verifying...' : 'Verify code'} <ArrowRight className="h-4 w-4" /></button><button type="button" onClick={() => { setError(''); setStep('email'); }} className="w-full text-sm font-semibold text-teal-700 hover:underline">Use a different email</button></form>}{step === 'password' && <form onSubmit={setPassword} className="mt-6 space-y-4">{passwordField('New password', newPassword, setNewPassword, showNewPassword, setShowNewPassword)}{passwordField('Confirm new password', confirmPassword, setConfirmPassword, showConfirmPassword, setShowConfirmPassword)}<button disabled={isLoading} className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-3 text-sm font-bold text-white hover:bg-teal-800 disabled:opacity-70">{isLoading ? 'Saving password...' : 'Reset password'} <CheckCircle2 className="h-4 w-4" /></button></form>}</section></div></main>;
};
