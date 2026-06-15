'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, LockOpen, Mail } from 'lucide-react';

export default function ForgotPassword() {
  const [step, setStep] = useState('EMAIL'); // 'EMAIL' | 'OTP' | 'PASSWORD' | 'SUCCESS'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(new Array(6).fill(''));
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);
  // Refs to control focus on the 6 separate OTP input boxes
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Handle email submission
  const handleEmailSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError('');


    try {
      const res = await fetch('/api/auth/forgot-password/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      // Even if email doesn't exist, safe practice can transition to prevent enumeration,
      if (res.ok) {
        setStep('OTP');
      } else {
        const data = await res.json();
        setError(data.message || 'Something went wrong.');
      }
    } catch (err) {
      setError('Failed to connect to server.');
    } finally {
      setLoading(false);
    }
  };

  // Handle 6-digit OTP Box Inputs
  const handleOtpChange = (element: any, index: number) => {
    if (isNaN(element.value)) return false;

    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);

    // Auto-focus next box if filled
    if (element.value !== '' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (e: any, index: number) => {
    // Handle backspace focus shift
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Automatically trigger verification when all 6 OTP boxes are filled
  useEffect(() => {
    if (otp.every((digit) => digit !== '')) {
      const fullOtp = otp.join('');
      verifyOtp(fullOtp);
    }
  }, [otp]);

  const verifyOtp = async (completedOtp: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/forgot-password/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: completedOtp }),
      });

      if (res.ok) {
        setStep('PASSWORD');
      } else {
        const data = await res.json();
        setError(data.message || 'Invalid or expired OTP.');
        setOtp(new Array(6).fill('')); // Clear boxes on failure
        inputRefs.current[0]?.focus();  // Reset focus
        // Update attempts state if returned by backend
        if (typeof data.attemptsLeft === 'number') {
          setAttemptsLeft(data.attemptsLeft);
        } else {
          // If no attempts left, the backend burned it
          setAttemptsLeft(0);
        }






      }
    } catch (err) {
      setError('Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  // Handle final password update submission
  const handlePasswordSubmit = async (e: any) => {

    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/forgot-password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otp.join(''), newPassword: password }),
      });

      if (res.ok) {
        setStep('SUCCESS');
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to reset password.');
      }
    } catch (err) {
      setError('Error resetting password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="w-full max-w-md bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700">
          <h2 className="text-2xl font-bold mb-6 text-zinc-900 dark:text-zinc-50">Reset Password</h2>

          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          {loading && <p className="text-zinc-500 text-sm mb-4">Processing...</p>}

          {/* STEP 1: ENTER EMAIL */}
          {step === 'EMAIL' && (
            <form onSubmit={handleEmailSubmit} className="space-y-8">
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-slate-400" size={20} />

                <input
                  type="email"
                  required
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-800 dark:text-white"
                  placeholder="Email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>


              <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                Send OTP
              </button>
            </form>
          )}

          {/* STEP 2: ENTER 6-DIGIT OTP */}
          {step === 'OTP' && (
            <div className="space-y-6">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">An OTP code has been sent to <span className="font-semibold">{email}</span>.</p>
              <div className="flex justify-between gap-2">
                {otp.map((data, index) => (
                  <input
                    key={index}
                    type="text"
                    maxLength={1}
                    ref={(el) => { inputRefs.current[index] = el; }}
                    className="w-12 h-12 text-center text-xl font-bold border border-zinc-300 dark:border-zinc-700 rounded bg-transparent text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={data}
                    onChange={(e) => handleOtpChange(e.target, index)}
                    onKeyDown={(e) => handleOtpKeyDown(e, index)}
                    disabled={loading}
                  />
                ))}
              </div>

              {attemptsLeft !== null && attemptsLeft > 0 && (
                <p className="text-xs font-medium text-amber-600 dark:text-amber-400 text-center ">
                  Careful! You have {attemptsLeft} {attemptsLeft === 1 ? 'attempt' : 'attempts'} remaining before this code expires.
                </p>
              )}

              <button
                onClick={() => { setStep('EMAIL'); setOtp(new Array(6).fill('')); }}
                className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline hover:cursor-pointer"
              >
                Change email / Resend code
              </button>
            </div>
          )}

          {/* STEP 3: ENTER NEW PASSWORD */}
          {step === 'PASSWORD' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-8">
              <div className="relative">
                < Lock className="absolute left-3 top-3 text-slate-400" size={20} />
                <input
                  type="password"
                  placeholder="Enter your new password"
                  required
                  minLength={8}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-800 dark:text-white"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="relative">
                < Lock className="absolute left-3 top-3 text-slate-400" size={20} />
                <input
                  type="password"
                  placeholder='Confirm your new password'
                  required
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-800 dark:text-white"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
              <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:cursor-pointer">
                Update Password
              </button>
            </form>
          )}

          {/* STEP 4: SUCCESS OVERLAY */}
          {step === 'SUCCESS' && (
            <div className="text-center space-y-4">
              <div className="text-emerald-500 text-5xl">✓</div>
              <p className="text-zinc-800 dark:text-zinc-200 font-medium">Password changed successfully!</p>
              <p className="text-sm text-zinc-500">You can now head back to the login page and access your tutorials.</p>
              <a href="/login" className="inline-block mt-4 text-blue-500 hover:underline text-sm font-medium">
                Go to Login
              </a>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}