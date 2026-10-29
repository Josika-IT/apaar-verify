import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Building2,
  Users,
  Search,
  CheckCircle2,
  ArrowRight,
  QrCode,
  FileText,
  AlertTriangle,
  Lock,
  BarChart3,
  Sparkles
} from 'lucide-react';

export const Landing: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Bar */}
      <header className="bg-aicte-navy text-white border-b-2 border-aicte-saffron py-3 px-6 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-aicte-saffron flex items-center justify-center font-bold text-slate-900 shadow">
              <ShieldCheck className="w-6 h-6 text-aicte-navy" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-white">APAAR-Verify</span>
              <p className="text-[11px] text-slate-300">AICTE National Student Data Verification & Intake Platform</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Link
              to="/verify"
              className="text-xs font-semibold px-3 py-2 text-slate-200 hover:text-white hover:bg-slate-800 rounded-md transition flex items-center gap-1.5"
            >
              <QrCode className="w-4 h-4 text-aicte-saffron" />
              <span>Verify a Record</span>
            </Link>
            <Link
              to="/login"
              className="bg-aicte-saffron hover:bg-amber-500 text-slate-950 font-bold text-xs px-4 py-2 rounded-md shadow transition flex items-center gap-1"
            >
              <span>Portal Login</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-aicte-navy via-slate-900 to-slate-800 text-white py-16 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-aicte-saffron text-xs font-semibold mb-6 border border-white/10 backdrop-blur-sm">
            <Sparkles className="w-4 h-4" />
            <span>Smart India Hackathon (SIH 26263) • AICTE Smart Automation</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight max-w-4xl mx-auto">
            Automated Student Data Management & Verification with{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-aicte-saffron to-yellow-300">
              APAAR ID
            </span>
          </h1>

          <p className="mt-5 text-sm sm:text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed">
            A unified, tamper-proof system for AICTE-approved institutions to upload admissions, validate 12-digit APAAR IDs, prevent multi-institution ghost enrolments, enforce statutory intake quotas, and empower employers with instant QR verification.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/login"
              className="w-full sm:w-auto px-6 py-3 rounded-lg bg-aicte-saffron hover:bg-amber-500 text-slate-950 font-bold text-sm shadow-lg transition flex items-center justify-center gap-2"
            >
              <Building2 className="w-4 h-4" />
              <span>Access Institutional / Admin Portal</span>
            </Link>
            <Link
              to="/verify"
              className="w-full sm:w-auto px-6 py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold text-sm border border-white/20 backdrop-blur transition flex items-center justify-center gap-2"
            >
              <QrCode className="w-4 h-4 text-aicte-saffron" />
              <span>Public Verification Portal (Scan QR)</span>
            </Link>
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
            <div className="bg-white/5 border border-white/10 p-4 rounded-xl backdrop-blur-sm">
              <p className="text-xs text-slate-400 font-medium">One Nation One ID</p>
              <p className="text-2xl font-bold text-white mt-1">12-Digit</p>
              <p className="text-[11px] text-slate-300 mt-1">Strict APAAR format enforcement</p>
            </div>
            <div className="bg-white/5 border border-white/10 p-4 rounded-xl backdrop-blur-sm">
              <p className="text-xs text-slate-400 font-medium">Compliance Auditing</p>
              <p className="text-2xl font-bold text-amber-400 mt-1">Intake Quotas</p>
              <p className="text-[11px] text-slate-300 mt-1">Automatic excess seat flagging</p>
            </div>
            <div className="bg-white/5 border border-white/10 p-4 rounded-xl backdrop-blur-sm">
              <p className="text-xs text-slate-400 font-medium">Cross-Institution</p>
              <p className="text-2xl font-bold text-emerald-400 mt-1">Duplicate Catch</p>
              <p className="text-[11px] text-slate-300 mt-1">Detects dual enrollment fraud</p>
            </div>
            <div className="bg-white/5 border border-white/10 p-4 rounded-xl backdrop-blur-sm">
              <p className="text-xs text-slate-400 font-medium">Verification Speed</p>
              <p className="text-2xl font-bold text-blue-400 mt-1">&lt; 100 ms</p>
              <p className="text-[11px] text-slate-300 mt-1">Consent-gated verifiable PDFs</p>
            </div>
          </div>
        </div>
      </section>

      {/* End-to-End Workflow Diagram Section */}
      <section className="py-16 px-6 max-w-6xl mx-auto w-full">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            End-to-End National Architecture Flow
          </h2>
          <p className="text-sm text-slate-500 mt-2 max-w-2xl mx-auto">
            From single & bulk CSV/Excel admission uploads to live statistical anomaly detection and verifiable digital credential issuance.
          </p>
        </div>

        {/* Visual Flow Grid */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 relative">
          {/* Step 1 */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-blue-100 text-aicte-navy flex items-center justify-center font-bold mb-3">
              <Building2 className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-aicte-navy uppercase tracking-wider mb-1">Step 1</span>
            <h3 className="text-sm font-bold text-slate-900">Institution</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              AICTE colleges manage approved intake & supernumerary quotas.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold mb-3">
              <FileText className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">Step 2</span>
            <h3 className="text-sm font-bold text-slate-900">Student Upload</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Single entry or bulk CSV/Excel with downloadable templates.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-rose-700 uppercase tracking-wider mb-1">Step 3</span>
            <h3 className="text-sm font-bold text-slate-900">APAAR Validation</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Pre-validation preview catches format & sanity errors before commit.
            </p>
          </div>

          {/* Step 4 */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-purple-700 uppercase tracking-wider mb-1">Step 4</span>
            <h3 className="text-sm font-bold text-slate-900">Data Verification</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Cross-institution duplicate checks & intake overflow validation.
            </p>
          </div>

          {/* Step 5 */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold mb-3">
              <BarChart3 className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">Step 5</span>
            <h3 className="text-sm font-bold text-slate-900">AICTE Monitoring</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Z-score anomaly detection, national heatmaps & audit trail.
            </p>
          </div>

          {/* Step 6 */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold mb-3">
              <QrCode className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">Step 6</span>
            <h3 className="text-sm font-bold text-slate-900">Authorized Verify</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Employers scan QR to verify accredited status & PDF certificate.
            </p>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="bg-white py-14 px-6 border-y border-slate-200">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl bg-slate-50 border border-slate-200">
              <div className="w-10 h-10 rounded-lg bg-aicte-navy text-aicte-saffron flex items-center justify-center mb-4">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Multi-Institution Fraud Detection</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Flags duplicate registrations where the same APAAR ID appears across multiple universities, preventing dual admissions and phantom enrolment funding.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-50 border border-slate-200">
              <div className="w-10 h-10 rounded-lg bg-emerald-700 text-white flex items-center justify-center mb-4">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Statistical Anomaly Engine</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Applies standard deviation z-score analysis on intake capacity utilization to automatically rank colleges into Low, Medium, and High Risk oversight categories.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-50 border border-slate-200">
              <div className="w-10 h-10 rounded-lg bg-amber-600 text-white flex items-center justify-center mb-4">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Consent-Gated Digital Credentials</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                In compliance with Section 43A of the IT Act, student consent flags control field disclosure. Generates official downloadable PDFs with QR codes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8 px-6 text-xs text-center border-t border-slate-800">
        <p className="font-semibold text-slate-300">All India Council for Technical Education (AICTE)</p>
        <p className="mt-1">Smart India Hackathon 2026 Prototype • Smart Automation SIH Problem ID 26263</p>
      </footer>
    </div>
  );
};
