import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { StatCard } from '../components/StatCard';
import { api } from '../services/api';
import { InstitutionDashboardData, CourseIntakeStat, ValidationFlag } from '../types';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import {
  Users,
  GraduationCap,
  Award,
  Globe,
  AlertTriangle,
  UploadCloud,
  FileCheck2,
  RefreshCw,
  Building,
  CheckCircle2,
  Info
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export const InstitutionDashboard: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<InstitutionDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [auditing, setAuditing] = useState(false);
  const [auditMsg, setAuditMsg] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.getInstitutionDashboard(user?.institution_id || undefined);
      setData(res);
    } catch (err) {
      console.error("Failed to load institution dashboard", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [user]);

  const handleRunAudit = async () => {
    try {
      setAuditing(true);
      const res = await api.runValidationAudit(user?.institution_id || undefined);
      setAuditMsg(`Self-Audit complete: ${res.total_flags} validation flags evaluated.`);
      await fetchDashboard();
      setTimeout(() => setAuditMsg(null), 5000);
    } catch (err) {
      console.error(err);
    } finally {
      setAuditing(false);
    }
  };

  if (loading || !data) {
    return (
      <Layout title="Institution Dashboard" subtitle="Loading institutional intake metrics...">
        <div className="flex items-center justify-center py-20 text-slate-400 gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-aicte-navy" />
          <span>Fetching institutional student data & intake compliance...</span>
        </div>
      </Layout>
    );
  }

  // Prepare chart data
  const chartData = data.course_breakdown.map((c) => ({
    name: c.branch.length > 20 ? c.branch.slice(0, 20) + '...' : c.branch,
    Approved: c.approved_intake,
    Enrolled: c.actual_enrolment,
    Regular: c.regular_count,
    Supernumerary: c.supernumerary_count,
    Excess: c.excess_count,
  }));

  // Category Pie Data
  const categoryColors = ['#002244', '#D97706', '#138808', '#7C3AED', '#EC4899'];
  const catPieData = Object.entries(data.category_distribution || {}).map(([name, value]) => ({
    name,
    value,
  }));

  return (
    <Layout
      title={`${data.institution_name}`}
      subtitle={`AICTE Approval Code: ${data.aicte_code} • One Nation One Student ID Central Node`}
      actionButton={
        <div className="flex items-center gap-2">
          <button
            onClick={handleRunAudit}
            disabled={auditing}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition flex items-center gap-1.5 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${auditing ? 'animate-spin' : ''}`} />
            <span>{auditing ? 'Auditing...' : 'Run Intake Audit'}</span>
          </button>
          <Link
            to="/upload"
            className="px-4 py-2 text-xs font-bold rounded-lg bg-aicte-navy hover:bg-slate-900 text-white transition flex items-center gap-1.5 shadow"
          >
            <UploadCloud className="w-4 h-4 text-aicte-saffron" />
            <span>Upload Student Data</span>
          </Link>
        </div>
      }
    >
      {auditMsg && (
        <div className="mb-6 bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-lg text-xs font-medium text-emerald-900 flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{auditMsg}</span>
        </div>
      )}

      {/* Cards Row: Approved Intake, Actual Enrolment, Supernumerary Seats, NRI/OCI/FN */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Approved AICTE Intake"
          value={data.total_approved_intake}
          subtitle="Statutory sanctioned seats"
          icon={GraduationCap}
          color="navy"
        />
        <StatCard
          title="Actual Total Enrolment"
          value={data.total_actual_enrolment}
          subtitle={`Regular: ${data.regular_enrolment} students`}
          icon={Users}
          color={data.regular_enrolment > data.total_approved_intake ? 'red' : 'green'}
          trend={
            data.regular_enrolment > data.total_approved_intake
              ? { value: `+${data.regular_enrolment - data.total_approved_intake} EXCESS`, isPositive: false }
              : { value: 'Within Quota', isPositive: true }
          }
        />
        <StatCard
          title="Supernumerary Seats"
          value={data.supernumerary_seats}
          subtitle="Exempt from regular intake cap"
          icon={Award}
          color="saffron"
        />
        <StatCard
          title="NRI / OCI / Foreign National"
          value={data.nri_count + data.foreign_national_count}
          subtitle={`NRI: ${data.nri_count} | OCI: ${data.oci_count} | FN: ${data.foreign_national_count}`}
          icon={Globe}
          color="purple"
        />
      </div>

      {/* Charts & Alerts Grid */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Intake vs Enrolment Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Approved Intake vs Actual Enrolment</h3>
              <p className="text-xs text-slate-500">Course-wise capacity comparison (Regular vs Approved)</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full">
              Academic Year 2024-25
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="Approved" fill="#002244" name="Approved Intake" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Enrolled" fill="#FF9933" name="Actual Total" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Excess" fill="#ef4444" name="Excess Intake" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alerts & Validation Flags Panel */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <h3 className="text-base font-bold text-slate-900">Compliance Alerts</h3>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
              {data.flags_count} Active
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 max-h-72 pr-1">
            {data.recent_flags.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 py-10">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-2" />
                <p className="text-xs font-semibold text-slate-600">Zero Validation Flags</p>
                <p className="text-[11px] text-slate-400">All student records comply with AICTE norms</p>
              </div>
            ) : (
              data.recent_flags.map((flag) => (
                <div
                  key={flag.id}
                  className={`p-3 rounded-lg border text-xs ${
                    flag.severity === 'CRITICAL'
                      ? 'bg-rose-50 border-rose-200 text-rose-900'
                      : flag.severity === 'ERROR'
                      ? 'bg-amber-50 border-amber-200 text-amber-900'
                      : 'bg-blue-50 border-blue-200 text-blue-900'
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold">
                    <span>{flag.rule_name.replace(/_/g, ' ')}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider bg-white/70">
                      {flag.severity}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-700 leading-snug">{flag.message}</p>
                  {flag.apaar_id && flag.apaar_id !== 'N/A_INTAKE' && (
                    <div className="mt-2 text-[10px] font-mono text-slate-500">APAAR: {flag.apaar_id}</div>
                  )}
                </div>
              ))
            )}
          </div>

          <Link
            to="/validation"
            className="mt-4 block text-center text-xs font-bold text-aicte-navy hover:text-blue-800 py-2 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition"
          >
            Review All Validation Results →
          </Link>
        </div>
      </div>

      {/* Category Breakdown & Quick Actions Row */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Category Pie Chart */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-1">Reservation Category Demographics</h3>
          <p className="text-xs text-slate-500 mb-4">General, OBC, SC, ST, EWS distribution</p>

          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={catPieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {catPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={categoryColors[index % categoryColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Course Details Table */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-slate-200 shadow-sm overflow-x-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Branch-wise Quota Compliance</h3>
              <p className="text-xs text-slate-500">Approved intake vs enrolled headcount per department</p>
            </div>
            <Link to="/records" className="text-xs font-semibold text-aicte-navy hover:underline">
              View All Student Records →
            </Link>
          </div>

          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase">
                <th className="pb-3">Course & Branch</th>
                <th className="pb-3 text-center">Approved</th>
                <th className="pb-3 text-center">Regular</th>
                <th className="pb-3 text-center">Supernumerary</th>
                <th className="pb-3 text-center">Total Enrolled</th>
                <th className="pb-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.course_breakdown.map((c, i) => (
                <tr key={i} className="hover:bg-slate-50 transition">
                  <td className="py-3 font-medium text-slate-900">
                    <div>{c.course} - {c.branch}</div>
                  </td>
                  <td className="py-3 text-center font-semibold text-slate-700">{c.approved_intake}</td>
                  <td className="py-3 text-center text-slate-600">{c.regular_count}</td>
                  <td className="py-3 text-center text-slate-600">{c.supernumerary_count}</td>
                  <td className="py-3 text-center font-bold text-slate-900">{c.actual_enrolment}</td>
                  <td className="py-3 text-center">
                    {c.regular_count > c.approved_intake ? (
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800">
                        Overflow (+{c.regular_count - c.approved_intake})
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                        Compliant
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};
