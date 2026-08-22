"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Shield, Sparkles, KeyRound, Mail, 
  User, Fingerprint, RefreshCw, Eye, 
  EyeOff, Lock 
} from 'lucide-react';

export default function AuthPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Input fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'Employee' | 'HR'>('Employee');

  // Error/Success
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);

  // Verification step
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationError, setVerificationError] = useState('');
  const [verificationResending, setVerificationResending] = useState(false);

  // Password Security check
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: 'None', color: '#8E847F', bg: 'bg-gray-200' };
    let score = 0;
    if (pass.length >= 6) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    switch (score) {
      case 1: return { score: 25, label: 'Weak', color: '#E96C6C', bg: 'bg-[#E96C6C]' };
      case 2: return { score: 50, label: 'Fair', color: '#F3CD5F', bg: 'bg-[#F3CD5F]' };
      case 3: return { score: 75, label: 'Good', color: '#CAB5F5', bg: 'bg-[#CAB5F5]' };
      case 4: return { score: 100, label: 'Strong', color: '#B5F12C', bg: 'bg-[#B5F12C]' };
      default: return { score: 10, label: 'Too Short', color: '#E96C6C', bg: 'bg-[#E96C6C]' };
    }
  };

  const strength = getPasswordStrength(password);

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    // Mock Login trigger based on the ID Rule: OI(First2)(Last2)(Year)(Serial)
    const validLogins = ['OICOFI20200001', 'OIALMA20230002']; // Admin, Employee
    if (validLogins.includes(email.toUpperCase())) {
      setSuccess('Logged in successfully! Redirecting...');
      
      // Simulate setting role in localStorage based on login
      if (typeof window !== 'undefined') {
        if (email.toUpperCase() === 'OICOFI20200001') {
           localStorage.setItem('dayflow_role', 'Admin');
        } else {
           localStorage.setItem('dayflow_role', 'Employee');
        }
      }

      setTimeout(() => {
        if (email.toUpperCase() === 'OICOFI20200001') {
          router.push('/admin'); // Redirect HR to Admin Dashboard
        } else {
          router.push('/'); // Redirect Employee to Employee Dashboard
        }
      }, 1000);
    } else {
      setError('Invalid credentials. Hint: use OICOFI20200001 (Admin) or OIALMA20230002 (Employee)');
    }
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!employeeId || !name || !email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    if (!employeeId.startsWith('DF-')) {
      setError('Employee ID must match the corporate prefix (e.g., DF-2026-0001).');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (strength.score < 50) {
      setError('Password is too weak. Ensure at least 6 characters, uppercase, and numbers.');
      return;
    }

    setIsVerifyingEmail(true);
  };

  const handleVerificationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setVerificationError('');

    if (verificationCode.length >= 4) {
      setSuccess('Email verified and registered! Redirecting to Workspace...');
      setIsVerifyingEmail(false);
      setTimeout(() => {
        router.push('/');
      }, 1500);
    } else {
      setVerificationError('Incorrect verification code. Please try typing "1234".');
    }
  };

  const handleCodeResend = () => {
    setVerificationResending(true);
    setTimeout(() => {
      setVerificationResending(false);
      alert('Verification code resent successfully!');
    }, 1200);
  };

  if (isVerifyingEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#2B2827] p-6 text-[#1F1B1A]">
        <div className="bg-[#FAF7F2] rounded-[28px] p-8 max-w-md w-full border border-black/5 shadow-[0_12px_36px_rgba(0,0,0,0.22)] animate-fade-in">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#B5F12C] text-[#151413] font-extrabold flex items-center justify-center">D</div>
              <span className="font-extrabold text-[#1F1B1A] text-lg tracking-tight">Dayflow</span>
            </div>
            <h2 className="text-xl font-extrabold text-[#1F1B1A]">Verify Your Email</h2>
            <p className="text-[#5E5652] text-xs mt-2 leading-relaxed">
              A 4-digit code was sent to <strong className="text-[#1F1B1A]">{email}</strong>. Enter it below to complete registration.
            </p>
          </div>

          <form onSubmit={handleVerificationSubmit} className="space-y-5">
            {verificationError && (
              <div className="bg-[#E96C6C]/10 text-[#6E1F1F] border border-[#E96C6C]/20 text-xs font-semibold p-3 rounded-[14px] text-center">
                {verificationError}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#5E5652]">Verification Code</label>
              <input
                type="text"
                maxLength={6}
                placeholder="e.g. 1234"
                className="w-full bg-white border border-[#E6E3DE] rounded-[14px] p-3 text-center text-lg font-bold tracking-[8px] focus:outline-none focus:ring-2 focus:ring-[#B5F12C] focus:border-[#B5F12C]"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#B5F12C] hover:bg-[#A0DE1E] text-[#151413] font-bold rounded-[14px] shadow-sm transition-transform active:scale-95"
            >
              Verify & Activate Account
            </button>

            <div className="flex flex-col items-center gap-3 mt-6">
              <button
                type="button"
                onClick={handleCodeResend}
                disabled={verificationResending}
                className="text-xs font-bold text-[#5E5652] hover:text-[#1F1B1A] flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw size={12} className={verificationResending ? 'animate-spin' : ''} />
                {verificationResending ? 'Resending...' : 'Resend Code'}
              </button>
              
              <button
                type="button"
                onClick={() => setIsVerifyingEmail(false)}
                className="text-xs font-semibold text-[#8E847F] hover:text-[#5E5652]"
              >
                Go Back
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#2B2827] p-6 text-[#1F1B1A]">
      <div className="bg-[#FAF7F2] rounded-[28px] p-8 max-w-md w-full border border-black/5 shadow-[0_12px_36px_rgba(0,0,0,0.22)] animate-fade-in">
        
        {/* Logo Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-[#B5F12C] text-[#151413] font-extrabold flex items-center justify-center">D</div>
            <span className="font-extrabold text-[#1F1B1A] text-lg tracking-tight">Dayflow</span>
          </div>
          <h2 className="text-xl font-extrabold text-[#1F1B1A]">
            {isSignUp ? 'Join Dayflow Workspace' : 'Welcome to Dayflow'}
          </h2>
          <p className="text-[#5E5652] text-xs mt-1">
            {isSignUp ? 'Register to setup your corporate profile.' : 'Sign in to access your HR portal and timesheets.'}
          </p>
        </div>

        {/* Form status alerts */}
        {error && (
          <div className="bg-[#E96C6C]/10 text-[#6E1F1F] border border-[#E96C6C]/20 text-xs font-semibold p-3 rounded-[14px] mb-5">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-[#B5F12C]/15 text-[#151413] border border-[#B5F12C]/30 text-xs font-semibold p-3 rounded-[14px] mb-5 text-center">
            {success}
          </div>
        )}

        {isSignUp ? (
          /* ================= SIGN UP ================= */
          <form onSubmit={handleSignUp} className="space-y-4">
            
            {/* Employee ID */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#5E5652]">Employee ID</label>
              <input
                type="text"
                placeholder="DF-YYYY-XXXX (e.g., DF-2026-0045)"
                className="w-full bg-white border border-[#E6E3DE] rounded-[14px] p-3 text-xs focus:outline-none focus:ring-2 focus:ring-[#B5F12C] focus:border-[#B5F12C]"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value.toUpperCase())}
                required
              />
            </div>

            {/* Name */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#5E5652]">Full Name</label>
              <input
                type="text"
                placeholder="Jordan Vance"
                className="w-full bg-white border border-[#E6E3DE] rounded-[14px] p-3 text-xs focus:outline-none focus:ring-2 focus:ring-[#B5F12C] focus:border-[#B5F12C]"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#5E5652]">Corporate Email</label>
              <input
                type="email"
                placeholder="jordan@dayflow.com"
                className="w-full bg-white border border-[#E6E3DE] rounded-[14px] p-3 text-xs focus:outline-none focus:ring-2 focus:ring-[#B5F12C] focus:border-[#B5F12C]"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#5E5652]">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="w-full bg-white border border-[#E6E3DE] rounded-[14px] p-3 pr-10 text-xs focus:outline-none focus:ring-2 focus:ring-[#B5F12C] focus:border-[#B5F12C]"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-[#8E847F]"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>

              {/* Password strength bar */}
              {password && (
                <div className="mt-2 space-y-1">
                  <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div className={`h-full ${strength.bg} transition-all duration-300`} style={{ width: `${strength.score}%` }}></div>
                  </div>
                  <span className="text-[10px] font-bold" style={{ color: strength.color }}>
                    Security: {strength.label}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#5E5652]">Confirm Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full bg-white border border-[#E6E3DE] rounded-[14px] p-3 text-xs focus:outline-none focus:ring-2 focus:ring-[#B5F12C] focus:border-[#B5F12C]"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            {/* Role select */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#5E5652]">Registration Role</label>
              <select
                className="w-full bg-white border border-[#E6E3DE] rounded-[14px] p-3 text-xs focus:outline-none focus:ring-2 focus:ring-[#B5F12C] focus:border-[#B5F12C]"
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
              >
                <option value="Employee">Employee (Timesheets only)</option>
                <option value="HR">HR Officer / Administrator</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#B5F12C] hover:bg-[#A0DE1E] text-[#151413] font-bold rounded-[14px] shadow-sm transition-transform active:scale-95 mt-4"
            >
              Sign Up & Verify Email
            </button>

            <p className="text-center text-xs text-[#5E5652] mt-4">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(false);
                  setError('');
                }}
                className="font-bold text-[#CAB5F5] hover:text-[#412A6E] text-decoration-none"
              >
                Sign In
              </button>
            </p>

          </form>
        ) : (
          /* ================= SIGN IN ================= */
          <form onSubmit={handleSignIn} className="space-y-5">
            
            {/* Login ID */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#5E5652]">Login ID</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. OIJODO20220001"
                  className="w-full bg-white border border-[#E6E3DE] rounded-[14px] p-3 pl-10 text-xs focus:outline-none focus:ring-2 focus:ring-[#B5F12C] focus:border-[#B5F12C]"
                  value={email}
                  onChange={(e) => setEmail(e.target.value.toUpperCase())}
                  required
                />
                <User size={14} className="absolute left-3.5 top-3.5 text-[#8E847F]" />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#5E5652]">Password</label>
                <button
                  type="button"
                  onClick={() => alert('Simulated reset password link sent to email.')}
                  className="text-[10px] font-bold text-[#8E847F] hover:text-[#5E5652]"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="w-full bg-white border border-[#E6E3DE] rounded-[14px] p-3 pl-10 pr-10 text-xs focus:outline-none focus:ring-2 focus:ring-[#B5F12C] focus:border-[#B5F12C]"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Lock size={14} className="absolute left-3.5 top-3.5 text-[#8E847F]" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-[#8E847F]"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#B5F12C] hover:bg-[#A0DE1E] text-[#151413] font-bold rounded-[14px] shadow-sm transition-transform active:scale-95 mt-4"
            >
              Sign In
            </button>

            <p className="text-center text-xs text-[#5E5652] mt-4">
              New to Dayflow?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(true);
                  setError('');
                }}
                className="font-bold text-[#CAB5F5] hover:text-[#412A6E] text-decoration-none"
              >
                Create Account
              </button>
            </p>
          </form>
        )}
      </div>

      {/* Basic Fade Animation Styling */}
      <style jsx global>{`
        .animate-fade-in {
          animation: fadeIn 0.35s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
