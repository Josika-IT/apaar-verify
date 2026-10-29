import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Lock, Mail, KeyRound, AlertCircle, RefreshCw, CheckCircle2, QrCode } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaChallenge, setCaptchaChallenge] = useState('78B9');
  const [useOtpStep, setUseOtpStep] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forgotMsg, setForgotMsg] = useState<string | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  const refreshCaptcha = () => {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaChallenge(code);
    setCaptchaInput('');
  };

  const fillCredentials = (demoEmail: string, demoPass: string, roleDescription: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
    setForgotMsg(null);
    setCaptchaInput(captchaChallenge);
    if (useOtpStep) setOtp('123456');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setForgotMsg(null);

    // Verify Captcha
    if (captchaInput.trim().toUpperCase() !== captchaChallenge.toUpperCase()) {
      setError('Invalid security captcha code. Please re-enter.');
      refreshCaptcha();
      return;
    }

    // Optional OTP check
    if (useOtpStep && otp.trim() !== '123456') {
      setError('Invalid 2FA OTP. For demo prototype, enter 123456.');
      return;
    }

    setLoading(true);
    try {
      const user = await login({
        email,
        password,
        otp: useOtpStep ? otp : undefined,
        captcha: captchaInput
      });

      // Role-based redirect
      if (user.role === 'aicte_admin') {
        navigate('/aicte-dashboard');
      } else if (user.role === 'institution_admin') {
        navigate('/institution-dashboard');
      } else if (user.role === 'verifier') {
        navigate('/verify');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || 'Authentication failed. Please verify credentials.');
      refreshCaptcha();
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    if (!email) {
      setError('Please provide your registered official email address first.');
      return;
    }
    setForgotMsg(`A secure reset token has been dispatched to ${email}. Check institutional inbox.`);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex items-center justify-center space-x-3 mb-2">
          <div className="w-12 h-12 rounded-full bg-aicte-navy text-aicte-saffron flex items-center justify-center shadow-md">
            <ShieldCheck className="w-7 h-7" />
          </div>
        </Link>
        <h2 className="text-center text-2xl font-extrabold text-slate-900 tracking-tight">
          AICTE Central Authentication Portal
        </h2>
        <p className="mt-1 text-center text-xs text-slate-600">
          APAAR ID-based Student Data Management & Verification System (SIH 26263)
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-slate-200 sm:px-10">
          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-3 rounded text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {forgotMsg && (
            <div className="mb-4 bg-emerald-50 border-l-4 border-emerald-500 p-3 rounded text-xs text-emerald-800 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{forgotMsg}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Official Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@aicte.gov.in"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-aicte-navy focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs font-semibold text-aicte-saffron hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-aicte-navy focus:border-transparent transition"
                />
              </div>
            </div>

            {/* Security Captcha */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Security Verification Captcha
              </label>
              <div className="flex items-center space-x-3">
                <div className="bg-slate-900 text-aicte-saffron font-mono tracking-widest text-lg font-bold px-4 py-2 rounded-lg select-none border border-slate-800">
                  {captchaChallenge}
                </div>
                <button
                  type="button"
                  onClick={refreshCaptcha}
                  className="p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition"
                  title="Refresh Captcha"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <input
                  type="text"
                  required
                  value={captchaInput}
                  onChange={(e) => setCaptchaInput(e.target.value)}
                  placeholder="Enter code"
                  className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-aicte-navy focus:border-transparent"
                />
              </div>
            </div>

            {/* Optional 2FA OTP Toggle */}
            <div className="pt-1">
              <label className="flex items-center space-x-2 cursor-pointer text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={useOtpStep}
                  onChange={(e) => setUseOtpStep(e.target.checked)}
                  className="rounded border-slate-300 text-aicte-navy focus:ring-aicte-navy"
                />
                <span>Simulate 2-Factor Authentication (OTP: <b>123456</b>)</span>
              </label>

              {useOtpStep && (
                <div className="mt-2 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter 6-digit OTP (e.g. 123456)"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-aicte-navy focus:border-transparent"
                  />
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-lg bg-aicte-navy hover:bg-slate-900 text-white font-bold text-sm shadow hover:shadow-lg transition flex items-center justify-center gap-2"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4 text-aicte-saffron" />}
                <span>{loading ? 'Authenticating...' : 'Sign In to Portal'}</span>
              </button>
            </div>
          </form>

          {/* Quick-Fill Demo Credentials (Required by Prompt) */}
          <div className="mt-6 pt-5 border-t border-slate-200">
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              ⚡ Quick-Fill Demo Accounts:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => fillCredentials('admin@aicte.gov.in', 'Admin@123', 'AICTE Admin')}
                className="p-2 text-left rounded-lg bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 transition"
              >
                <div className="font-bold text-aicte-navy">🏛️ AICTE Admin</div>
                <div className="text-[11px] text-slate-500">admin@aicte.gov.in</div>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials('admin@iitd.ac.in', 'Admin@123', 'IIT Delhi')}
                className="p-2 text-left rounded-lg bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 transition"
              >
                <div className="font-bold text-amber-800">🏫 IIT Delhi Admin</div>
                <div className="text-[11px] text-slate-500">admin@iitd.ac.in</div>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials('admin@coep.ac.in', 'Admin@123', 'COEP Pune')}
                className="p-2 text-left rounded-lg bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-300 transition"
              >
                <div className="font-bold text-rose-800">🚨 COEP Pune (Excess Intake)</div>
                <div className="text-[11px] text-slate-500">admin@coep.ac.in</div>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials('verifier@tcs.com', 'Verifier@123', 'Verifier')}
                className="p-2 text-left rounded-lg bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 transition"
              >
                <div className="font-bold text-emerald-800">🔍 TCS Verifier (Employer)</div>
                <div className="text-[11px] text-slate-500">verifier@tcs.com</div>
              </button>
            </div>
            <p className="mt-2 text-[11px] text-slate-400 text-center">
              Password for all demo accounts: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-700">Admin@123</code> or <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-700">Verifier@123</code>
            </p>
          </div>
        </div>

        <div className="mt-4 text-center">
          <Link to="/verify" className="text-xs text-aicte-navy font-semibold hover:underline flex items-center justify-center gap-1">
            <QrCode className="w-3.5 h-3.5 text-aicte-saffron" />
            <span>Looking to verify a student record without logging in? Click here</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
