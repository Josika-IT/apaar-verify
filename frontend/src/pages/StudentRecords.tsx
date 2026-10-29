import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { api } from '../services/api';
import { Student } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  Search,
  Filter,
  FileDown,
  Edit,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
  RefreshCw,
  Eye,
  ShieldCheck,
  X,
  FileText
} from 'lucide-react';

export const StudentRecords: React.FC = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [quotaFilter, setQuotaFilter] = useState('');

  // Edit Modal State
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Student>>({});
  const [savingEdit, setSavingEdit] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await api.getStudents({
        institution_id: user?.role === 'institution_admin' ? (user.institution_id || undefined) : undefined,
        search: search.trim() || undefined,
        status: statusFilter || undefined,
        quota: quotaFilter || undefined,
        limit: 100
      });
      setStudents(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchStudents();
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [search, statusFilter, quotaFilter, user]);

  const openEditModal = (student: Student) => {
    setEditingStudent(student);
    setEditFormData({
      name: student.name,
      apaar_id: student.apaar_id,
      dob: student.dob,
      course: student.course,
      branch: student.branch,
      quota: student.quota,
      category: student.category,
      consent_flag: student.consent_flag,
      verification_status: student.verification_status
    });
    setSaveSuccess(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    try {
      setSavingEdit(true);
      const updated = await api.updateStudent(editingStudent.id, editFormData);
      setSaveSuccess(`Student ${updated.name} updated successfully!`);
      // Update local state
      setStudents((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      setTimeout(() => {
        setEditingStudent(null);
        setSaveSuccess(null);
      }, 1200);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <Layout
      title="Student Academic Registry"
      subtitle="Search, audit, edit, and download tamper-proof verifiable digital student credentials"
    >
      {/* Search and Filter Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by APAAR ID, Student Name, Roll No..."
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-aicte-navy focus:border-transparent transition"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-700 focus:ring-2 focus:ring-aicte-navy focus:border-transparent"
          >
            <option value="">All Statuses</option>
            <option value="Verified">Verified Only</option>
            <option value="Flagged">Flagged / Anomalous</option>
            <option value="Pending">Pending Audit</option>
          </select>

          <select
            value={quotaFilter}
            onChange={(e) => setQuotaFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-700 focus:ring-2 focus:ring-aicte-navy focus:border-transparent"
          >
            <option value="">All Quotas</option>
            <option value="Regular">Regular Quota</option>
            <option value="Supernumerary">Supernumerary</option>
            <option value="NRI">NRI Quota</option>
          </select>

          <button
            onClick={fetchStudents}
            title="Refresh List"
            className="p-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-3">
            <RefreshCw className="w-5 h-5 animate-spin text-aicte-navy" />
            <span>Loading registry records...</span>
          </div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-slate-600 text-sm">No student records found</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your search criteria or upload new records.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3.5">APAAR ID</th>
                  <th className="p-3.5">Student Name</th>
                  <th className="p-3.5">Roll / Reg ID</th>
                  <th className="p-3.5">Institution</th>
                  <th className="p-3.5">Course & Branch</th>
                  <th className="p-3.5">Quota</th>
                  <th className="p-3.5">Consent</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5 font-mono font-bold text-aicte-navy">
                      <div className="flex items-center gap-1.5">
                        <span>{student.apaar_id}</span>
                      </div>
                    </td>
                    <td className="p-3.5 font-semibold text-slate-900">
                      <div>{student.name}</div>
                      <div className="text-[10px] text-slate-400 font-normal">DOB: {student.dob} • {student.gender}</div>
                    </td>
                    <td className="p-3.5 font-mono text-slate-600">{student.student_id}</td>
                    <td className="p-3.5 text-slate-700 max-w-xs truncate" title={student.institution_name}>
                      {student.institution_name || 'N/A'}
                    </td>
                    <td className="p-3.5 text-slate-600">
                      <div>{student.course}</div>
                      <div className="text-[10px] text-slate-400">{student.branch}</div>
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        student.quota === 'Regular'
                          ? 'bg-blue-50 text-blue-700'
                          : student.quota === 'Supernumerary'
                          ? 'bg-amber-50 text-amber-800'
                          : 'bg-purple-50 text-purple-800'
                      }`}>
                        {student.quota}
                      </span>
                    </td>
                    <td className="p-3.5">
                      {student.consent_flag ? (
                        <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Consented
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                          Restricted
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-center">
                      {student.verification_status === 'Verified' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3" /> Verified
                        </span>
                      ) : student.verification_status === 'Flagged' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">
                          <AlertTriangle className="w-3 h-3" /> Flagged
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                          <Clock className="w-3 h-3" /> Pending
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-right space-x-1">
                      {/* Verifiable PDF Download (Requirement 10) */}
                      <a
                        href={api.getPdfRecordUrl(student.apaar_id)}
                        target="_blank"
                        rel="noreferrer"
                        title="Download Verifiable PDF with QR Code"
                        className="inline-flex items-center p-1.5 text-aicte-navy hover:bg-blue-50 rounded transition"
                      >
                        <FileDown className="w-4 h-4" />
                      </a>

                      {/* Edit Button */}
                      {(user?.role === 'aicte_admin' || user?.role === 'institution_admin') && (
                        <button
                          onClick={() => openEditModal(student)}
                          title="Edit Student Record"
                          className="inline-flex items-center p-1.5 text-slate-600 hover:bg-slate-100 rounded transition"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Student Modal */}
      {editingStudent && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Edit Student Record</h3>
                <p className="text-xs text-slate-500">Updating record #{editingStudent.id} • {editingStudent.student_id}</p>
              </div>
              <button
                onClick={() => setEditingStudent(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {saveSuccess && (
              <div className="mb-4 bg-emerald-50 border border-emerald-300 p-3 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{saveSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Student Name</label>
                  <input
                    type="text"
                    required
                    value={editFormData.name || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">APAAR ID (12-Digit)</label>
                  <input
                    type="text"
                    required
                    maxLength={12}
                    value={editFormData.apaar_id || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, apaar_id: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    required
                    value={editFormData.dob || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, dob: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Admission Quota</label>
                  <select
                    value={editFormData.quota || 'Regular'}
                    onChange={(e) => setEditFormData({ ...editFormData, quota: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="Regular">Regular</option>
                    <option value="Supernumerary">Supernumerary</option>
                    <option value="NRI">NRI</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="flex items-center space-x-2 cursor-pointer pt-2">
                  <input
                    type="checkbox"
                    checked={editFormData.consent_flag || false}
                    onChange={(e) => setEditFormData({ ...editFormData, consent_flag: e.target.checked })}
                    className="rounded text-aicte-navy"
                  />
                  <span className="font-semibold text-slate-800">Student Data Disclosure Consent (IT Act)</span>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 border rounded-lg font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2 bg-aicte-navy text-white rounded-lg font-bold hover:bg-slate-900 transition flex items-center gap-1.5"
                >
                  {savingEdit ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5 text-aicte-saffron" />}
                  <span>{savingEdit ? 'Saving...' : 'Save & Re-Audit'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};
