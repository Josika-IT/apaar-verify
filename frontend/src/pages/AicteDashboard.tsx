import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { StatCard } from '../components/StatCard';
import { api } from '../services/api';
import { AicteDashboardData, Institution } from '../types';
import { Link } from 'react-router-dom';
import {
  Building2,
  Users,
  GraduationCap,
  AlertTriangle,
  Activity,
  FileBarChart2,
  RefreshCw,
  TrendingUp,
  MapPin,
  ExternalLink,
  ShieldAlert,
  Radio
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export const AicteDashboard: React.FC = () => {
  const [data, setData] = useState<AicteDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [pollingActive, setPollingActive] = useState(true);

  // Fetch stats
  const fetchStats = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const res = await api.getAicteDashboard();
      setData(res);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error("Failed to load AICTE dashboard data", err);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Live polling every 10s (Requirement 7)
  useEffect(() => {
    if (!pollingActive) return;
    const interval = setInterval(() => {
      fetchStats(true);
    }, 10000); // 10s polling
    return () => clearInterval(interval);
  }, [pollingActive]);

  if (loading && !data) {
    return (
      <Layout title="AICTE Central Monitoring Command" subtitle="Connecting to National Central Student Registry...">
        <div className="flex items-center justify-center py-20 text-slate-400 gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-aicte-navy" />
          <span>Synchronizing national intake and APAAR verification telemetry...</span>
        </div>
      </Layout>
    );
  }

  if (!data) return null;

  return (
    <Layout
      title="National Technical Education Command Center"
      subtitle="AICTE Central Student Registry • Real-time Monitoring & Statutory Intake Oversight"
      actionButton={
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold">
            <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
            <span>Live Polling (10s)</span>
          </div>

          <button
            onClick={() => fetchStats(false)}
            title="Refresh Telemetry"
            className="p-2 border border-slate-300 rounded-lg text-slate-700 bg-white hover:bg-slate-50 transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <Link
            to="/reports"
            className="px-4 py-2 text-xs font-bold rounded-lg bg-aicte-navy hover:bg-slate-900 text-white transition flex items-center gap-1.5 shadow"
          >
            <FileBarChart2 className="w-4 h-4 text-aicte-saffron" />
            <span>Export Official Reports</span>
          </Link>
        </div>
      }
    >
      {/* Top Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard
          title="Accredited Institutions"
          value={data.total_institutions}
          subtitle="Registered AICTE colleges & universities"
          icon={Building2}
          color="navy"
        />
        <StatCard
          title="Sanctioned Intake"
          value={data.total_approved_intake.toLocaleString()}
          subtitle="Total statutory seat capacity"
          icon={GraduationCap}
          color="saffron"
        />
        <StatCard
          title="Actual Enrolled Headcount"
          value={data.total_actual_enrolment.toLocaleString()}
          subtitle={`Supernumerary: ${data.total_supernumerary} | NRI: ${data.total_nri_fn}`}
          icon={Users}
          color="green"
        />
        <StatCard
          title="Excess Enrolment Flags"
          value={data.excess_enrolment_institutions_count}
          subtitle={`High Risk Anomaly Entities: ${data.high_risk_institutions_count}`}
          icon={ShieldAlert}
          color="red"
          trend={{ value: 'Action Required', isPositive: false }}
        />
      </div>

      {/* Red Flags Alert Panel: Excess Intake Violators (Requirement 7) */}
      {data.top_excess_institutions.length > 0 && (
        <div className="mb-8 bg-rose-50 border border-rose-300 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-rose-900 font-extrabold text-sm sm:text-base">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              <span>Critical Statutory Warning: Institutions Exceeding Approved AICTE Intake</span>
            </div>
            <Link
              to="/anomalies"
              className="text-xs font-bold text-rose-800 hover:text-rose-950 underline"
            >
              View Z-Score Anomaly Matrix →
            </Link>
          </div>
          <p className="text-xs text-rose-700 mb-4">
            The following institutions have enrolled regular students in excess of their sanctioned AICTE intake quotas. Automatic notice generation and compliance freeze recommended.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.top_excess_institutions.map((inst) => {
              const excess = Math.max(0, inst.actual_enrolment - inst.approved_intake);
              return (
                <div key={inst.id} className="bg-white rounded-lg p-4 border border-rose-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 truncate">{inst.name}</span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800">
                        Risk: {inst.risk_score} / 100 ({inst.risk_level})
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{inst.aicte_code} • {inst.city}, {inst.state}</div>

                    <div className="mt-3 flex items-center justify-between text-xs bg-slate-50 p-2 rounded">
                      <span>Approved Intake: <b>{inst.approved_intake}</b></span>
                      <span>Enrolled: <b>{inst.actual_enrolment}</b></span>
                      <span className="text-rose-600 font-bold">Overflow: +{excess} seats</span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[11px] pt-2 border-t border-slate-100">
                    <span className="text-slate-400">Status: {inst.status}</span>
                    <Link
                      to={`/records?institution_id=${inst.id}`}
                      className="text-aicte-navy font-semibold hover:underline flex items-center gap-1"
                    >
                      Audit Student Registry <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Charts Grid: National Enrolment Trend & State-wise Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* National Trends Area Chart */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">National Enrolment Progression</h3>
              <p className="text-xs text-slate-500">Sanctioned capacity vs enrolled students across academic cycles</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-aicte-navy rounded-full">
              4-Year Trend
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.enrolment_trends} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorEnrolled" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF9933" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#FF9933" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorApproved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#002244" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#002244" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="academic_year" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="approved" stroke="#002244" fillOpacity={1} fill="url(#colorApproved)" name="Approved Capacity" />
                <Area type="monotone" dataKey="enrolled" stroke="#FF9933" fillOpacity={1} fill="url(#colorEnrolled)" name="Actual Enrolment" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* State-wise Breakdown Bar Chart */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">State-wise Enrolment Distribution</h3>
              <p className="text-xs text-slate-500">Student population and flagged institutions per state</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full">
              Regional Telemetry
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.state_breakdown} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="state" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="actual_enrolment" fill="#002244" name="Enrolled Students" radius={[4, 4, 0, 0]} />
                <Bar dataKey="excess_count" fill="#ef4444" name="Excess Intake" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* State-wise Summary Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 overflow-hidden">
        <h3 className="text-base font-bold text-slate-900 mb-1">State Higher Education Performance Table</h3>
        <p className="text-xs text-slate-500 mb-4">Statutory intake capacity utilization and flagged institution counts by state</p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 font-semibold uppercase">
              <tr>
                <th className="p-3">State / Union Territory</th>
                <th className="p-3 text-center">Institutions</th>
                <th className="p-3 text-center">Approved Intake</th>
                <th className="p-3 text-center">Actual Enrolment</th>
                <th className="p-3 text-center">Capacity Utilization</th>
                <th className="p-3 text-center">Excess Seats</th>
                <th className="p-3 text-center">Flagged Colleges</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.state_breakdown.map((st, idx) => {
                const util = Math.round((st.actual_enrolment / Math.max(st.approved_intake, 1)) * 100);
                return (
                  <tr key={idx} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-bold text-slate-900 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-aicte-saffron" />
                      <span>{st.state}</span>
                    </td>
                    <td className="p-3 text-center text-slate-700">{st.institutions_count}</td>
                    <td className="p-3 text-center font-semibold text-slate-800">{st.approved_intake}</td>
                    <td className="p-3 text-center font-bold text-aicte-navy">{st.actual_enrolment}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        util > 100 ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {util}%
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      {st.excess_count > 0 ? (
                        <span className="font-bold text-rose-600">+{st.excess_count}</span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {st.flagged_institutions > 0 ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-900">
                          {st.flagged_institutions} Flagged
                        </span>
                      ) : (
                        <span className="text-emerald-700 font-semibold">Clean</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};
