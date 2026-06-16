import React, { useState, useEffect } from 'react';
import api from '../api';
import { Lock, AlertCircle, RefreshCw, KeyRound, ArrowLeft, Eye, EyeOff, ShieldCheck, Mail } from 'lucide-react';

export default function AdminLogin({ onLoginSuccess }) {
  // Shared state
  const [email, setEmail]   = useState('');
  const [error, setError]   = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Mode: 'otp' (default/preferred) | 'password'
  const [loginMode, setLoginMode] = useState('otp');

  // OTP flow
  const [otpRequired, setOtpRequired] = useState(false);
  const [otp, setOtp]           = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  // Password flow
  const [password, setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Resend countdown
  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => setResendTimer(t => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const switchMode = (mode) => {
    setLoginMode(mode);
    setError('');
    setMessage('');
    setOtpRequired(false);
    setOtp('');
    setPassword('');
  };

  // ── OTP: Step 1 — request code ─────────────────────────────────────────────
  const handleOtpRequest = async (e) => {
    e.preventDefault();
    if (!email) { setError('Please enter your email address.'); return; }
    setLoading(true); setError(''); setMessage('');
    try {
      const res = await api.post('/auth/login', { email });
      if (res.data.otpRequired) {
        setOtpRequired(true);
        setMessage(res.data.message);
        setResendTimer(30);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed. Please verify your email.');
    } finally {
      setLoading(false);
    }
  };

  // ── OTP: Step 2 — verify code ──────────────────────────────────────────────
  const handleOtpVerify = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) { setError('Please enter a valid 6-digit OTP.'); return; }
    setLoading(true); setError('');
    try {
      const res = await api.post('/auth/verify-otp', { email, otp });
      const { token, admin } = res.data;
      localStorage.setItem('adminToken', token);
      localStorage.setItem('adminUser', JSON.stringify(admin));
      onLoginSuccess(admin);
    } catch (err) {
      setError(err.response?.data?.message || 'OTP verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── OTP: Resend ────────────────────────────────────────────────────────────
  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setLoading(true); setError(''); setMessage('');
    try {
      const res = await api.post('/auth/login', { email });
      setMessage(res.data.message);
      setOtp('');
      setResendTimer(30);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  // ── Password login ─────────────────────────────────────────────────────────
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError('Please enter both email and password.'); return; }
    setLoading(true); setError('');
    try {
      const res = await api.post('/auth/login-password', { email, password });
      const { token, admin } = res.data;
      localStorage.setItem('adminToken', token);
      localStorage.setItem('adminUser', JSON.stringify(admin));
      onLoginSuccess(admin);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToEmail = () => {
    setOtpRequired(false);
    setOtp('');
    setError('');
    setMessage('');
  };

  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-200px)] p-5">
      <div className="max-w-[440px] w-full bg-white border border-slate-100 rounded-3xl p-8 md:p-10 shadow-xl flex flex-col text-center relative overflow-hidden">

        {/* Top gradient bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand-orange to-brand-violet" />

        {/* ── STEP 1 / Email form (shared across both modes before OTP is sent) ── */}
        {!otpRequired ? (
          <>
            {/* Icon + title */}
            <div className="mb-5">
              <div className={`w-[60px] h-[60px] rounded-full flex items-center justify-center mx-auto mb-4 border shadow-sm transition-colors duration-300
                ${loginMode === 'otp'
                  ? 'bg-brand-orange/10 text-brand-orange border-brand-orange/20 shadow-brand-orange/20'
                  : 'bg-brand-violet/10 text-brand-violet border-brand-violet/20 shadow-brand-violet/20'
                }`}>
                {loginMode === 'otp' ? <Mail size={26} /> : <Lock size={26} />}
              </div>
              <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight font-display mb-1">Admin Login</h2>
              <p className="text-xs text-slate-400 leading-relaxed px-2">Sign in to manage tool categories, structures, and cards.</p>
            </div>

            {/* Mode tabs */}
            <div className="flex bg-slate-50 border border-slate-200 rounded-xl p-1 mb-6 gap-1">
              <button
                type="button"
                onClick={() => switchMode('otp')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer
                  ${loginMode === 'otp'
                    ? 'bg-white text-brand-orange shadow-sm border border-slate-100'
                    : 'text-slate-400 hover:text-slate-600'
                  }`}
              >
                <ShieldCheck size={13} />
                OTP (Preferred)
              </button>
              <button
                type="button"
                onClick={() => switchMode('password')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer
                  ${loginMode === 'password'
                    ? 'bg-white text-brand-violet shadow-sm border border-slate-100'
                    : 'text-slate-400 hover:text-slate-600'
                  }`}
              >
                <Lock size={13} />
                Password
              </button>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs font-medium text-rose-600 mb-5 text-left">
                <AlertCircle size={15} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* ── OTP mode form ── */}
            {loginMode === 'otp' && (
              <form onSubmit={handleOtpRequest} className="flex flex-col gap-4">
                <div className="flex flex-col text-left gap-1.5">
                  <label htmlFor="otp-email" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
                  <input
                    id="otp-email"
                    type="email"
                    placeholder="akhilthadaka97@gmail.com"
                    className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/10 outline-none transition-all text-sm font-medium"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="flex items-center justify-center gap-2 px-5 py-3.5 bg-brand-orange hover:bg-brand-orange-hover text-white rounded-xl shadow-md hover:shadow-brand-orange/20 transition-all font-semibold text-sm w-full cursor-pointer disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? <><RefreshCw className="animate-spin" size={16} /><span>Sending Code...</span></> : <><ShieldCheck size={15} /><span>Send Verification Code</span></>}
                </button>
                <p className="text-[11px] text-slate-400 mt-1">A 6-digit OTP will be sent to your email inbox.</p>
              </form>
            )}

            {/* ── Password mode form ── */}
            {loginMode === 'password' && (
              <form onSubmit={handlePasswordLogin} className="flex flex-col gap-4">
                <div className="flex flex-col text-left gap-1.5">
                  <label htmlFor="pass-email" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
                  <input
                    id="pass-email"
                    type="email"
                    placeholder="akhilthadaka97@gmail.com"
                    className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:border-brand-violet focus:ring-4 focus:ring-brand-violet/10 outline-none transition-all text-sm font-medium"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="flex flex-col text-left gap-1.5">
                  <label htmlFor="pass-password" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Password</label>
                  <div className="relative">
                    <input
                      id="pass-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      className="w-full px-4 py-3 pr-11 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:border-brand-violet focus:ring-4 focus:ring-brand-violet/10 outline-none transition-all text-sm font-medium"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  className="flex items-center justify-center gap-2 px-5 py-3.5 bg-brand-violet hover:bg-brand-violet-hover text-white rounded-xl shadow-md hover:shadow-brand-violet/20 transition-all font-semibold text-sm w-full cursor-pointer disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? <><RefreshCw className="animate-spin" size={16} /><span>Signing In...</span></> : <><Lock size={15} /><span>Sign In with Password</span></>}
                </button>
                <p className="text-[11px] text-slate-400 mt-1">For quick access without waiting for an email.</p>
              </form>
            )}
          </>
        ) : (
          /* ── STEP 2: OTP verification ── */
          <>
            <button
              onClick={handleBackToEmail}
              className="absolute top-6 left-6 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer flex items-center justify-center w-8 h-8 rounded-full hover:bg-slate-50"
              title="Back to email"
            >
              <ArrowLeft size={18} />
            </button>

            <div className="mb-6">
              <div className="w-[60px] h-[60px] rounded-full bg-brand-violet/10 flex items-center justify-center mx-auto mb-4 text-brand-violet border border-brand-violet/20 shadow-sm shadow-brand-violet/20">
                <KeyRound size={26} />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight font-display mb-1.5">Enter OTP Code</h2>
              <p className="text-xs text-slate-400 leading-relaxed px-4">
                We sent a 6-digit code to <span className="font-semibold text-slate-600 break-all">{email}</span>.
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs font-medium text-rose-600 mb-5 text-left">
                <AlertCircle size={15} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {message && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs font-medium text-emerald-600 mb-5 text-left">
                {message}
              </div>
            )}

            <form onSubmit={handleOtpVerify} className="flex flex-col">
              <div className="flex flex-col text-left gap-1.5 mb-5">
                <label htmlFor="login-otp" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center mb-1">6-Digit Verification Code</label>
                <input
                  id="login-otp"
                  type="text"
                  maxLength={6}
                  placeholder="000000"
                  pattern="[0-9]{6}"
                  inputMode="numeric"
                  autoFocus
                  className="w-full px-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:border-brand-violet focus:ring-4 focus:ring-brand-violet/10 outline-none transition-all text-xl font-bold tracking-[0.5em] text-center font-mono placeholder:text-slate-300"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                  required
                />
              </div>

              <button
                type="submit"
                className="flex items-center justify-center gap-2 px-5 py-3.5 bg-brand-violet hover:bg-brand-violet-hover text-white rounded-xl shadow-md hover:shadow-brand-violet/20 transition-all font-semibold text-sm w-full cursor-pointer disabled:opacity-50"
                disabled={loading}
              >
                {loading
                  ? <><RefreshCw className="animate-spin" size={16} /><span>Verifying...</span></>
                  : <span>Verify &amp; Login</span>
                }
              </button>

              <div className="mt-5 text-xs">
                <span className="text-slate-400">Didn't receive the email? </span>
                {resendTimer > 0 ? (
                  <span className="text-slate-500 font-semibold">Resend in {resendTimer}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="text-brand-orange hover:text-brand-orange-hover font-bold hover:underline bg-transparent border-none p-0 cursor-pointer disabled:opacity-40"
                    disabled={loading}
                  >
                    Resend Code
                  </button>
                )}
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
