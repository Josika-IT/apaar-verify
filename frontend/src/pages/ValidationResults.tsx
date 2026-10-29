import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { StatCard } from '../components/StatCard';
import { api } from '../services/api';
import { ValidationReport, ValidationFlag } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  AlertTriangle,
  AlertCircle,
  Copy,
  Users2,
  CheckCircle2,
  RefreshCw,
  Building2,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const ValidationResults: React.FC = () => {
  const { user } = useAuth();
  const [report, setReport] = useState<ValidationReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [reAuditing, setReAuditing] = useState(false);
  const [severityFilter, setSeverityFilter] = useState('');
  const [ruleFilter, setRuleFilter] = useState('');
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await api.getValidationReport({
        institution_id: user?.role === 'institution_admin' ? (user.institution_id || undefined) : undefined,
        severity: severityFilter || undefined,
        rule_name: ruleFilter || undefined
      });
      setReport(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [severityFilter, ruleFilter, user]);

  const handleRunAudit = async () => {
    try {
      setReAuditing(true);
      const res = await api.runValidationAudit(user?.role === 'institution_admin' ? (user.institution_id || undefined) : undefined);
      setActionMsg(`Full validation audit completed. Generated ${res.total_flags} validation flags across ${res.flagged_students_count} students.`);
      await fetchReport();
      setTimeout(() => setActionMsg(null), 5000);
    } catch (err) {
      console.error(err);
    } finally {
      setReAuditing(false);
    }
  };

  const handleUpdateStatus = async (flagId: number, newStatus: string) => {
    try {
      await api.updateFlagStatus(flagId, newStatus);
      setReport((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          flags: prev.flags.map((f) => (f.id === flagId ? { ...f, status: newStatus as any } : f))
        };
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Layout
      title="Statutory Validation & Anomaly Findings"
      subtitle="Automated inspection against AICTE intake regulations, 12-digit APAAR validity, and cross-university duplicate enrolment"
      actionButton={
        <button
          onClick={handleRunAudit}
          disabled={reAuditing}
          className="px-4 py-2 text-xs font-bold rounded-lg bg-aicte-navy hover:bg-slate-900 text-white shadow transition flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${reAuditing ? 'animate-spin' : ''}`} />
          <span>{reAuditing ? 'Auditing Repository...' : 'Execute Fresh System Audit'}</span>
        </button>
      }
    >
      {actionMsg && (
        <div className="mb-6 bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-lg text-xs font-medium text-emerald-900 flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* Summary Stat Cards */}
      {report && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <StatCard
            title="Total Flags"
            value={report.total_flags}
            subtitle="Violations requiring review"
            icon={ShieldAlert}
            color="red"
          />
          <StatCard
            title="Internal Duplicates"
            value={report.duplicate_internal_count}
            subtitle="Same college collision"
            icon={Copy}
            color="amber"
          />
          <StatCard
            title="Cross-Institution Duplicates"
            value={report.duplicate_cross_count}
            subtitle="Multi-college enrolment fraud"
            icon={Users2}
            color="red"
          />
          <StatCard
            title="Excess Intake Overflow"
            value={report.excess_intake_count}
            subtitle="Statutory capacity exceeded"
            icon={Building2}
            color="saffron"
          />
          <StatCard
            title="Format / Sanity Errors"
            value={report.format_error_count + report.inconsistency_count}
            subtitle="Invalid APAAR / Age / Quota"
            icon={AlertTriangle}
            color="purple"
          />
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="text-[11px] font-semibold text-slate-500 block mb-0.5">Filter Severity</label>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
            >
              <option value="">All Severities</option>
              <option value="CRITICAL">Critical Only</option>
              <option value="ERROR">Error Only</option>
              <option value="WARNING">Warning Only</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-500 block mb-0.5">Filter Rule Type</label>
            <select
              value={ruleFilter}
              onChange={(e) => setRuleFilter(e.target.value)}
              className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
            >
              <option value="">All Validation Rules</option>
              <option value="DUPLICATE_APAAR_CROSS">Cross-Institution Duplicate</option>
              <option value="DUPLICATE_APAAR_INTERNAL">Internal Duplicate APAAR</option>
              <option value="EXCESS_INTAKE">Excess Intake Quota</option>
              <option value="INVALID_APAAR_FORMAT">Invalid APAAR Format</option>
              <option value="DOB_SANITY_ERROR">Age / DOB Sanity Error</option>
              <option value="CITIZENSHIP_MISMATCH">Citizenship / Quota Inconsistency</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-500">
          Showing <b>{report?.flags.length || 0}</b> active audit anomalies
        </div>
      </div>

      {/* Flags List Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-3">
            <RefreshCw className="w-5 h-5 animate-spin text-aicte-navy" />
            <span>Evaluating validation rules...</span>
          </div>
        ) : !report || report.flags.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
            <p className="font-bold text-slate-800 text-sm">No Validation Violations Detected</p>
            <p className="text-xs text-slate-500 mt-1">All processed records satisfy AICTE intake quotas and APAAR identity verification standards.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {report.flags.map((flag) => (
              <div key={flag.id} className="p-4 sm:p-5 hover:bg-slate-50 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider ${
                        flag.severity === 'CRITICAL'
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : flag.severity === 'ERROR'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-blue-100 text-blue-800 border border-blue-300'
                      }`}
                    >
                      {flag.severity}
                    </span>

                    <span className="text-xs font-bold text-slate-800">
                      {flag.rule_name.replace(/_/g, ' ')}
                    </span>

                    <span className="text-[11px] text-slate-400 font-mono">
                      #{flag.id}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-900 font-semibold leading-relaxed">
                    {flag.message}
                  </p>

                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1 font-medium text-slate-700">
                      <Building2 className="w-3.5 h-3.5 text-aicte-navy" />
                      <span>{flag.institution_name}</span>
                    </span>

                    {flag.apaar_id && flag.apaar_id !== 'N/A_INTAKE' && (
                      <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                        APAAR: {flag.apaar_id}
                      </span>
                    )}

                    {flag.details && (
                      <span className="text-slate-500 italic">
                        {flag.details}
                      </span>
                    )}
                  </div>
                </div>

                {/* Status action buttons */}
                <div className="flex items-center gap-2 self-end md:self-center">
                  <span
                    className={`text-[11px] font-semibold px-2 py-1 rounded ${
                      flag.status === 'RESOLVED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : flag.status === 'ACKNOWLEDGED'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-900'
                    }`}
                  >
                    {flag.status}
                  </span>

                  {flag.status !== 'RESOLVED' && (
                    <button
                      onClick={() => handleUpdateStatus(flag.id, 'RESOLVED')}
                      className="px-2.5 py-1 text-xs font-semibold rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300 transition"
                    >
                      Mark Resolved
                    </button>
                  )}

                  {flag.status === 'OPEN' && (
                    <button
                      onClick={() => handleUpdateStatus(flag.id, 'ACKNOWLEDGED')}
                      className="px-2.5 py-1 text-xs font-semibold rounded bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                    >
                      Acknowledge
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};
