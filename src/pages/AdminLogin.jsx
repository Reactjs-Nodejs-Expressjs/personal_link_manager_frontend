import React, { useState, useEffect } from 'react';
import api from '../api';
import { Lock, AlertCircle, RefreshCw, KeyRound, ArrowLeft } from 'lucide-react';

export default function AdminLogin({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [otpRequired, setOtpRequired] = useState(false);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(t => t - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const startResendCountdown = () => {
    setResendTimer(30);
  };

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');
    
    try {
      const res = await api.post('/auth/login', { email });
      if (res.data.otpRequired) {
        setOtpRequired(true);
        setMessage(res.data.message);
        startResendCountdown();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed. Please verify your email.');
      console.error('Credentials submit error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP.');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const res = await api.post('/auth/verify-otp', { email, otp });
      const { token, admin } = res.data;
      
      // Save credentials in localStorage
      localStorage.setItem('adminToken', token);
      localStorage.setItem('adminUser', JSON.stringify(admin));
      
      onLoginSuccess(admin);
    } catch (err) {
      setError(err.response?.data?.message || 'OTP verification failed. Please try again.');
      console.error('OTP verify error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    
    setLoading(true);
    setError('');
    setMessage('');
    
    try {
      const res = await api.post('/auth/login', { email });
      setMessage(res.data.message);
      setOtp('');
      startResendCountdown();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setOtpRequired(false);
    setOtp('');
    setError('');
    setMessage('');
  };

  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-200px)] p-5">
      <div className="max-w-[420px] w-full bg-white border border-slate-100 rounded-3xl p-8 md:p-10 shadow-xl flex flex-col text-center relative overflow-hidden">
        
        {/* Decorative subtle top color bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand-orange to-brand-violet"></div>

        {!otpRequired ? (
          /* STEP 1: Credentials Submission */
          <>
            <div className="mb-6">
              <div className="w-[60px] h-[60px] rounded-full bg-[#f97316]/10 flex items-center justify-center mx-auto mb-4 text-[#f97316] border border-[#f97316]/20 shadow-sm shadow-[#f97316]/20">
                <Lock size={26} />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight font-display mb-1.5">Admin Login</h2>
              <p className="text-xs text-slate-400 leading-relaxed px-2">Sign in to manage tool categories, nested structures, and cards.</p>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs font-medium text-rose-600 mb-6 text-left">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCredentialsSubmit} className="flex flex-col">
              <div className="flex flex-col text-left gap-1.5 mb-6">
                <label htmlFor="login-email" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
                <input
                  id="login-email"
                  type="email"
                  placeholder="akhilthadaka97@gmail.com"
                  className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:border-[#f97316] focus:ring-4 focus:ring-[#f97316]/10 outline-none transition-all text-sm font-medium"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <button 
                type="submit" 
                className="flex items-center justify-center gap-2 px-5 py-3.5 bg-[#f97316] hover:bg-[#ea580c] text-white rounded-xl shadow-md hover:shadow-[#f97316]/20 transition-all font-semibold text-sm w-full cursor-pointer disabled:opacity-50"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <RefreshCw className="animate-spin" size={16} />
                    <span>Sending Code...</span>
                  </>
                ) : (
                  <span>Send Verification Code</span>
                )}
              </button>
            </form>
          </>
        ) : (
          /* STEP 2: OTP Verification */
          <>
            <div className="mb-6">
              <button 
                onClick={handleBackToLogin}
                className="absolute top-6 left-6 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer flex items-center justify-center w-8 h-8 rounded-full hover:bg-slate-50"
                title="Back to login credentials"
              >
                <ArrowLeft size={18} />
              </button>

              <div className="w-[60px] h-[60px] rounded-full bg-brand-violet/10 flex items-center justify-center mx-auto mb-4 text-brand-violet border border-brand-violet/20 shadow-sm shadow-brand-violet/20">
                <KeyRound size={26} />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight font-display mb-1.5">Enter OTP Code</h2>
              <p className="text-xs text-slate-400 leading-relaxed px-4">
                We sent a 6-digit verification code to <span className="font-semibold text-slate-600 break-all">{email}</span>.
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs font-medium text-rose-600 mb-6 text-left">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {message && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs font-medium text-emerald-600 mb-6 text-left">
                <span>{message}</span>
              </div>
            )}

            <form onSubmit={handleOtpSubmit} className="flex flex-col">
              <div className="flex flex-col text-left gap-1.5 mb-6">
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
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                  required
                />
              </div>

              <button 
                type="submit" 
                className="flex items-center justify-center gap-2 px-5 py-3.5 bg-brand-violet hover:bg-brand-violet-hover text-white rounded-xl shadow-md hover:shadow-brand-violet/20 transition-all font-semibold text-sm w-full cursor-pointer disabled:opacity-50"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <RefreshCw className="animate-spin" size={16} />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <span>Verify & Login</span>
                )}
              </button>

              <div className="mt-6 text-xs">
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
