import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { api } from '../services/api';
import { VerificationResult } from '../types';
import { useSearchParams } from 'react-router-dom';
import {
  QrCode,
  Search,
  CheckCircle2,
  XCircle,
  FileDown,
  ShieldCheck,
  Building2,
  Lock,
  Eye,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  ExternalLink
} from 'lucide-react';

export const VerificationPortal: React.FC = () => {
  const [searchParams] = useSearchParams();
  const urlApaar = searchParams.get('apaar_id');

  const [apaarInput, setApaarInput] = useState(urlApaar || '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const performVerification = async (targetId: string) => {
    if (!targetId.trim()) return;

    try {
      setLoading(true);
      setErrorMessage(null);
      const res = await api.verifyApaar(targetId.trim());
      setResult(res);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.response?.data?.detail || 'Verification lookup failed.');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (urlApaar) {
      performVerification(urlApaar);
    }
  }, [urlApaar]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performVerification(apaarInput);
  };

  const fillQuickApaar = (id: string) => {
    setApaarInput(id);
    performVerification(id);
  };

  return (
    <Layout
      title="National APAAR Verification Portal"
      subtitle="Authorized employer & regulatory public academic credential verification under the National APAAR Framework"
    >
      {/* Top Search Hero Box */}
      <div className="bg-gradient-to-r from-aicte-navy to-slate-900 text-white rounded-2xl p-6 sm:p-10 shadow-lg border border-slate-700 max-w-4xl mx-auto mb-10">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-14 h-14 rounded-full bg-aicte-saffron text-slate-900 mx-auto flex items-center justify-center mb-4 shadow">
            <QrCode className="w-8 h-8 text-aicte-navy" />
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            Verify Student Academic Record
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-2">
            Enter the 12-digit APAAR ID printed on the student certificate or scan the QR code to verify live accreditation and enrollment validity.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                required
                maxLength={12}
                value={apaarInput}
                onChange={(e) => setApaarInput(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter 12-Digit APAAR ID (e.g. 889911223344)"
                className="w-full px-4 py-3 rounded-xl text-slate-900 font-mono text-sm sm:text-base border-2 border-transparent focus:border-aicte-saffron focus:outline-none shadow-inner"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-aicte-saffron hover:bg-amber-500 text-slate-950 font-bold text-sm shadow transition flex items-center justify-center gap-2"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4 text-aicte-navy" />}
              <span>{loading ? 'Verifying...' : 'Authenticate'}</span>
            </button>
          </form>

          {/* Quick Test Demo APAAR IDs */}
          <div className="mt-6 pt-4 border-t border-white/10 text-xs flex flex-wrap items-center justify-center gap-2">
            <span className="text-slate-400">⚡ Test Sample APAAR IDs:</span>
            <button
              type="button"
              onClick={() => fillQuickApaar('889911223344')}
              className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-amber-300 font-mono transition"
            >
              889911223344 (Verified)
            </button>
            <button
              type="button"
              onClick={() => fillQuickApaar('772233445566')}
              className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-rose-300 font-mono transition"
            >
              772233445566 (Cross-Duplicate)
            </button>
            <button
              type="button"
              onClick={() => fillQuickApaar('000000000000')}
              className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-slate-300 font-mono transition"
            >
              000000000000 (Non-Existent)
            </button>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="max-w-3xl mx-auto mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg text-xs text-red-700">
          {errorMessage}
        </div>
      )}

      {/* Verification Result Card */}
      {result && (
        <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in duration-300">
          {/* Header Banner */}
          <div
            className={`p-6 text-white flex items-center justify-between ${
              result.is_valid && result.verification_status === 'Verified'
                ? 'bg-gradient-to-r from-emerald-800 to-teal-900'
                : result.is_valid && result.verification_status === 'Flagged'
                ? 'bg-gradient-to-r from-rose-800 to-amber-900'
                : 'bg-gradient-to-r from-slate-800 to-gray-900'
            }`}
          >
            <div className="flex items-center gap-3">
              {result.is_valid ? (
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur">
                  <CheckCircle2 className="w-8 h-8 text-white" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur">
                  <XCircle className="w-8 h-8 text-rose-300" />
                </div>
              )}

              <div>
                <h3 className="text-lg font-black tracking-tight">
                  {result.is_valid ? 'OFFICIALLY VERIFIED RECORD' : 'RECORD NOT RECOGNIZED'}
                </h3>
                <p className="text-xs text-slate-200">
                  {result.is_valid
                    ? `Status: ${result.verification_status.toUpperCase()} in AICTE Central Student Registry`
                    : 'No matching academic credential found'}
                </p>
              </div>
            </div>

            {result.is_valid && (
              <a
                href={api.getPdfRecordUrl(result.apaar_id)}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs rounded-lg shadow transition flex items-center gap-1.5"
              >
                <FileDown className="w-4 h-4 text-aicte-navy" />
                <span>Download Verifiable PDF</span>
              </a>
            )}
          </div>

          {/* Consent Notice */}
          <div className="p-4 bg-slate-50 border-b border-slate-200 text-xs flex items-center gap-2">
            <Lock className="w-4 h-4 text-slate-500 shrink-0" />
            <span className="text-slate-700">
              <b>Data Privacy Notice:</b> {result.consent_notice}
            </span>
          </div>

          {/* Details Body */}
          {result.is_valid && (
            <div className="p-6 sm:p-8 space-y-6">
              {/* Highlighted ID Row: Requirement 10 APAAR ID printed beside Student ID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-blue-50/60 p-4 rounded-xl border border-blue-200">
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase">National APAAR ID</span>
                  <div className="text-lg font-black font-mono text-aicte-navy mt-0.5">{result.apaar_id}</div>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase">Institutional Roll / Reg ID</span>
                  <div className="text-lg font-black font-mono text-aicte-navy mt-0.5">{result.student_id_masked}</div>
                </div>
              </div>

              {/* Grid of Verified Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="font-semibold text-slate-500 block mb-1">Student Name</span>
                  <span className="text-sm font-bold text-slate-900">{result.name_masked}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-500 block mb-1">Date of Birth</span>
                  <span className="text-sm font-bold text-slate-900">{result.dob_masked}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-500 block mb-1">Affiliated Institution</span>
                  <span className="text-sm font-bold text-slate-900">{result.institution_name}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-500 block mb-1">AICTE Approval Code</span>
                  <span className="text-sm font-mono font-bold text-slate-900">{result.aicte_code}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-500 block mb-1">Degree Program</span>
                  <span className="text-sm font-bold text-slate-900">{result.course}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-500 block mb-1">Branch / Specialization</span>
                  <span className="text-sm font-bold text-slate-900">{result.branch}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-500 block mb-1">Current Year</span>
                  <span className="text-sm font-bold text-slate-900">Year {result.year_of_study}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-500 block mb-1">Date of Admission</span>
                  <span className="text-sm font-bold text-slate-900">{result.admission_date}</span>
                </div>
              </div>

              {/* Timestamp & Integrity Hash */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
                <span>Verified: {result.verification_timestamp}</span>
                <span className="font-mono">Central Key: SHA256-AUTHENTICATED</span>
              </div>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
};
