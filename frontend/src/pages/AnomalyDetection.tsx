import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { StatCard } from '../components/StatCard';
import { api } from '../services/api';
import { AnomalyReport, AnomalyItem } from '../types';
import {
  Activity,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Search,
  Filter,
  Building2,
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const AnomalyDetection: React.FC = () => {
  const [report, setReport] = useState<AnomalyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [riskFilter, setRiskFilter] = useState('');
  const [search, setSearch] = useState('');

  const fetchAnomalies = async () => {
    try {
      setLoading(true);
      const res = await api.getAnomalies();
      setReport(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnomalies();
  }, []);

  const filteredAnomalies = report?.anomalies.filter((a) => {
    const matchRisk = riskFilter ? a.risk_level === riskFilter : true;
    const matchSearch = search ? a.institution_name.toLowerCase().includes(search.toLowerCase()) || a.state.toLowerCase().includes(search.toLowerCase()) : true;
    return matchRisk && matchSearch;
  });

  return (
    <Layout
      title="Intake Anomaly & Statistical Outlier Engine"
      subtitle="Z-score statistical deviation analysis on capacity utilization combined with rule-based fraud detection heuristics"
      actionButton={
        <button
          onClick={fetchAnomalies}
          className="px-4 py-2 text-xs font-bold rounded-lg bg-aicte-navy hover:bg-slate-900 text-white shadow transition flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Re-calculate Outlier Z-Scores</span>
        </button>
      }
    >
      {/* Metrics Row */}
      {report && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <StatCard
            title="Mean Capacity Utilization"
            value={`${report.mean_utilization}%`}
            subtitle="National baseline average"
            icon={Activity}
            color="navy"
          />
          <StatCard
            title="Standard Deviation (σ)"
            value={`±${report.std_dev_utilization}%`}
            subtitle="Variance across institutions"
            icon={TrendingUp}
            color="purple"
          />
          <StatCard
            title="High Risk (Red Flag)"
            value={report.high_risk_count}
            subtitle="Risk score ≥ 65 (Immediate Audit)"
            icon={ShieldAlert}
            color="red"
          />
          <StatCard
            title="Medium Risk"
            value={report.medium_risk_count}
            subtitle="35 ≤ Risk score < 65"
            icon={AlertTriangle}
            color="amber"
          />
          <StatCard
            title="Low Risk (Compliant)"
            value={report.low_risk_count}
            subtitle="Normal capacity operating limits"
            icon={CheckCircle2}
            color="green"
          />
        </div>
      )}

      {/* Explanation Banner */}
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-900 leading-relaxed flex items-start gap-3">
        <Activity className="w-5 h-5 text-aicte-navy shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-slate-900 block mb-0.5">Statistical Outlier (Z-Score) Mathematical Model</span>
          Institutions with an intake capacity utilization z-score Z = (X - &mu;) / &sigma; &gt; 1.8 or enrolment exceeding sanctioned intake are automatically assigned High Risk scores. This flags colleges operating unapproved sections or enrolling phantom duplicate students across state lines.
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search institution name or state..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-aicte-navy"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <label className="text-xs font-semibold text-slate-600">Risk Category:</label>
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
          >
            <option value="">All Risk Levels</option>
            <option value="High">High Risk Only</option>
            <option value="Medium">Medium Risk</option>
            <option value="Low">Low Risk</option>
          </select>
        </div>
      </div>

      {/* Anomaly Cards List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-3">
            <RefreshCw className="w-5 h-5 animate-spin text-aicte-navy" />
            <span>Calculating z-scores and risk indexes...</span>
          </div>
        ) : !filteredAnomalies || filteredAnomalies.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-xl border border-slate-200 text-slate-400">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <p className="font-bold text-slate-800 text-sm">No Institutions Match Risk Criteria</p>
          </div>
        ) : (
          filteredAnomalies.map((item) => (
            <div
              key={item.institution_id}
              className={`bg-white rounded-xl p-5 border shadow-sm transition hover:shadow-md ${
                item.risk_level === 'High'
                  ? 'border-l-4 border-l-rose-500 border-slate-200'
                  : item.risk_level === 'Medium'
                  ? 'border-l-4 border-l-amber-500 border-slate-200'
                  : 'border-l-4 border-l-emerald-500 border-slate-200'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-aicte-navy" />
                    <h3 className="text-sm font-bold text-slate-900">{item.institution_name}</h3>
                    <span className="text-xs text-slate-400">({item.state})</span>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-600">
                    <span>Approved Intake: <b>{item.approved_intake}</b></span>
                    <span>Actual Enrolment: <b>{item.actual_enrolment}</b></span>
                    <span>Capacity Utilization: <b>{item.utilization_rate}%</b></span>
                    <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                      Z-Score: <b>{item.z_score > 0 ? `+${item.z_score}` : item.z_score}σ</b>
                    </span>
                  </div>
                </div>

                {/* Risk score gauge badge */}
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Overall Risk Score</div>
                    <div className="text-xl font-black text-slate-900">{item.risk_score} / 100</div>
                  </div>

                  <span
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider ${
                      item.risk_level === 'High'
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : item.risk_level === 'Medium'
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    }`}
                  >
                    {item.risk_level} Risk
                  </span>
                </div>
              </div>

              {/* Detected Reasons & Violations */}
              <div className="mt-4">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Algorithm Analysis Indicators & Root Causes:
                </span>
                <ul className="space-y-1">
                  {item.reasons.map((r, i) => (
                    <li key={i} className="text-xs text-slate-700 flex items-start gap-2">
                      <span className={item.risk_level === 'High' ? 'text-rose-500' : 'text-amber-500'}>•</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400">Active Flags: <b>{item.flags_count}</b></span>
                <Link
                  to={`/records?institution_id=${item.institution_id}`}
                  className="text-aicte-navy font-semibold hover:underline flex items-center gap-1"
                >
                  <span>Drill down into Student Records</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </Layout>
  );
};
