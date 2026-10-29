import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { api } from '../services/api';
import { AuditLog } from '../types';
import {
  History,
  Search,
  RefreshCw,
  ShieldCheck,
  User,
  Clock,
  Terminal,
  FileText
} from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionSearch, setActionSearch] = useState('');
  const [emailSearch, setEmailSearch] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.getAuditLogs({
        action: actionSearch.trim() || undefined,
        user_email: emailSearch.trim() || undefined,
        limit: 100
      });
      setLogs(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delay = setTimeout(() => {
      fetchLogs();
    }, 300);
    return () => clearTimeout(delay);
  }, [actionSearch, emailSearch]);

  return (
    <Layout
      title="System Audit Trail & Security Ledger"
      subtitle="Immutable cryptographic access logs tracking all admission uploads, record edits, verification hits, and compliance audits"
      actionButton={
        <button
          onClick={fetchLogs}
          className="p-2 border border-slate-300 rounded-lg text-slate-700 bg-white hover:bg-slate-50 transition"
          title="Refresh Log Stream"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      }
    >
      {/* Search and Filter */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={actionSearch}
            onChange={(e) => setActionSearch(e.target.value)}
            placeholder="Search Action (e.g. STUDENT_UPLOAD)..."
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-aicte-navy"
          />
        </div>

        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={emailSearch}
            onChange={(e) => setEmailSearch(e.target.value)}
            placeholder="Search User Email..."
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-aicte-navy"
          />
        </div>

        <div className="text-xs text-slate-500">
          Total Recorded Actions: <b>{logs.length}</b>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-3">
            <RefreshCw className="w-5 h-5 animate-spin text-aicte-navy" />
            <span>Retrieving audit stream...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <History className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="font-bold text-slate-700 text-sm">No Audit Entries Found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-semibold uppercase">
                <tr>
                  <th className="p-3">Log ID</th>
                  <th className="p-3">Timestamp (UTC)</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Entity</th>
                  <th className="p-3">User & Role</th>
                  <th className="p-3">Client IP</th>
                  <th className="p-3">Audit Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-mono text-slate-400 font-bold">#{log.id}</td>
                    <td className="p-3 text-slate-500 whitespace-nowrap">
                      {log.timestamp.replace('T', ' ').slice(0, 19)}
                    </td>
                    <td className="p-3">
                      <span className="font-mono font-bold text-aicte-navy bg-blue-50 px-2 py-0.5 rounded text-[11px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-slate-700">
                      {log.entity} {log.entity_id ? `(#${log.entity_id})` : ''}
                    </td>
                    <td className="p-3">
                      <div className="font-medium text-slate-900">{log.user_email}</div>
                      <div className="text-[10px] text-slate-400 font-semibold uppercase">{log.user_role}</div>
                    </td>
                    <td className="p-3 font-mono text-slate-500">{log.ip_address}</td>
                    <td className="p-3 text-slate-600 max-w-sm truncate" title={log.details || ''}>
                      {log.details || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
};
