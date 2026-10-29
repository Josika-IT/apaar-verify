import React, { useState } from 'react';
import { Layout } from '../components/Layout';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  UserPlus,
  RefreshCw,
  Info,
  ShieldCheck
} from 'lucide-react';

export const StudentUpload: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'bulk' | 'single'>('bulk');

  // Bulk upload states
  const [file, setFile] = useState<File | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [previewData, setPreviewData] = useState<any | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Single entry form states
  const [formData, setFormData] = useState({
    apaar_id: '',
    student_id: '',
    name: '',
    dob: '',
    gender: 'Male',
    course: 'B.Tech',
    branch: 'Computer Science and Engineering',
    year_of_study: 1,
    admission_date: new Date().toISOString().slice(0, 10),
    category: 'General',
    quota: 'Regular',
    oci_status: false,
    foreign_national: false,
    nationality: 'Indian',
    consent_flag: true,
  });

  const [singleSubmitting, setSingleSubmitting] = useState(false);
  const [singleSuccess, setSingleSuccess] = useState<string | null>(null);

  // Handle file select and auto-run validation preview
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setErrorMessage(null);
      setSubmitSuccess(null);

      // Trigger preview validation automatically
      await runPreview(selectedFile);
    }
  };

  const runPreview = async (targetFile: File) => {
    try {
      setPreviewLoading(true);
      setErrorMessage(null);
      const fd = new FormData();
      fd.append('file', targetFile);

      const res = await api.bulkUploadStudents(fd, true, user?.institution_id || undefined);
      setPreviewData(res);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.response?.data?.detail || 'Failed to parse file for validation preview.');
      setPreviewData(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleBulkSubmit = async () => {
    if (!file) return;

    try {
      setSubmitting(true);
      setErrorMessage(null);
      const fd = new FormData();
      fd.append('file', file);

      const res = await api.bulkUploadStudents(fd, false, user?.institution_id || undefined);
      setSubmitSuccess(res);
      setPreviewData(null);
      setFile(null);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.response?.data?.detail || 'Failed to submit student dataset.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSingleSubmitting(true);
    setErrorMessage(null);
    setSingleSuccess(null);

    try {
      const res = await api.createStudent({
        ...formData,
        institution_id: user?.institution_id || undefined
      });
      setSingleSuccess(`Student '${res.name}' successfully registered with APAAR ID: ${res.apaar_id}! Status: ${res.verification_status}`);
      // Reset form
      setFormData({
        apaar_id: '',
        student_id: '',
        name: '',
        dob: '',
        gender: 'Male',
        course: 'B.Tech',
        branch: 'Computer Science and Engineering',
        year_of_study: 1,
        admission_date: new Date().toISOString().slice(0, 10),
        category: 'General',
        quota: 'Regular',
        oci_status: false,
        foreign_national: false,
        nationality: 'Indian',
        consent_flag: true,
      });
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.response?.data?.detail || 'Failed to register student record.');
    } finally {
      setSingleSubmitting(false);
    }
  };

  return (
    <Layout
      title="Student Admissions Data Upload"
      subtitle="Upload single or bulk student records with real-time 12-digit APAAR and statutory intake quota validation"
    >
      {/* Tab Switcher */}
      <div className="flex border-b border-slate-200 mb-6">
        <button
          onClick={() => { setActiveTab('bulk'); setErrorMessage(null); }}
          className={`py-3 px-6 text-sm font-bold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'bulk'
              ? 'border-aicte-navy text-aicte-navy bg-white rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span>Bulk CSV / Excel Upload</span>
        </button>
        <button
          onClick={() => { setActiveTab('single'); setErrorMessage(null); }}
          className={`py-3 px-6 text-sm font-bold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'single'
              ? 'border-aicte-navy text-aicte-navy bg-white rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <UserPlus className="w-4 h-4 text-aicte-saffron" />
          <span>Single Student Entry Form</span>
        </button>
      </div>

      {errorMessage && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg text-xs text-red-700 flex items-start gap-2 shadow-sm">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {submitSuccess && (
        <div className="mb-6 bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-lg text-xs text-emerald-900 shadow-sm">
          <div className="flex items-center gap-2 font-bold mb-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Dataset Upload Completed Successfully</span>
          </div>
          <p>
            Processed <b>{submitSuccess.total_processed}</b> records. Inserted: <b>{submitSuccess.inserted_count}</b>, Generated <b>{submitSuccess.flags_generated}</b> validation flags.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => navigate('/records')}
              className="px-3 py-1.5 bg-aicte-navy text-white text-xs font-semibold rounded hover:bg-slate-900 transition"
            >
              View Uploaded Records →
            </button>
            <button
              onClick={() => navigate('/validation')}
              className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 text-xs font-semibold rounded hover:bg-slate-50 transition"
            >
              Review Validation Flags →
            </button>
          </div>
        </div>
      )}

      {/* TAB 1: Bulk CSV / Excel Upload */}
      {activeTab === 'bulk' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Upload Admissions Batch File</h3>
                <p className="text-xs text-slate-500 mt-0.5">Supports CSV, XLSX, and XLS formats up to 5,000 students per batch</p>
              </div>
              <a
                href={api.getTemplateDownloadUrl()}
                download
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 rounded-lg transition"
              >
                <Download className="w-4 h-4" />
                <span>Download Sample CSV Template</span>
              </a>
            </div>

            {/* Drag & Drop Area */}
            <div className="mt-6">
              <label className="border-2 border-dashed border-slate-300 hover:border-aicte-navy rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer bg-slate-50 hover:bg-blue-50/40 transition">
                <UploadCloud className="w-12 h-12 text-slate-400 mb-3" />
                <span className="text-sm font-semibold text-slate-700">
                  {file ? file.name : 'Click to choose or drag & drop CSV or Excel spreadsheet'}
                </span>
                <span className="text-xs text-slate-400 mt-1">.csv, .xlsx, .xls</span>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Loading Preview */}
          {previewLoading && (
            <div className="bg-white rounded-xl p-8 border border-slate-200 shadow-sm text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-aicte-navy mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-800">Validating Student Dataset...</p>
              <p className="text-xs text-slate-500 mt-1">Running 12-digit APAAR checks, age sanity tests, and citizenship validation across rows.</p>
            </div>
          )}

          {/* Validation Preview Table with Row-Level Errors (Prompt Requirement 4) */}
          {previewData && !previewLoading && (
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Pre-Commit Validation Preview</h3>
                  <p className="text-xs text-slate-500">Inspect row-level errors and sanity warnings before finalizing submission</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                    Total: {previewData.total_rows}
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                    Valid: {previewData.valid_rows_count}
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-100 text-rose-800">
                    Flagged / Errors: {previewData.invalid_rows_count}
                  </span>
                  <button
                    onClick={handleBulkSubmit}
                    disabled={submitting}
                    className="px-4 py-2 text-xs font-bold rounded-lg bg-aicte-navy hover:bg-slate-900 text-white shadow transition flex items-center gap-1.5"
                  >
                    {submitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5 text-aicte-saffron" />}
                    <span>{submitting ? 'Committing...' : 'Commit to Central Registry'}</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto max-h-96 border border-slate-200 rounded-lg">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-semibold sticky top-0">
                    <tr>
                      <th className="p-3">#</th>
                      <th className="p-3">APAAR ID</th>
                      <th className="p-3">Student Name</th>
                      <th className="p-3">Roll / Reg ID</th>
                      <th className="p-3">Course / Branch</th>
                      <th className="p-3">Quota</th>
                      <th className="p-3">Pre-Validation Status</th>
                      <th className="p-3">Issues / Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {previewData.preview_rows.map((row: any) => (
                      <tr
                        key={row.row_number}
                        className={row.is_valid ? 'hover:bg-slate-50' : 'bg-rose-50/40 hover:bg-rose-50'}
                      >
                        <td className="p-3 font-mono text-slate-500">{row.row_number}</td>
                        <td className="p-3 font-mono font-semibold text-slate-800">{row.data.apaar_id || 'MISSING'}</td>
                        <td className="p-3 font-medium text-slate-900">{row.data.name}</td>
                        <td className="p-3 text-slate-600">{row.data.student_id}</td>
                        <td className="p-3 text-slate-600">{row.data.course} - {row.data.branch}</td>
                        <td className="p-3 text-slate-600">{row.data.quota}</td>
                        <td className="p-3">
                          {row.is_valid ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3 h-3" /> Valid
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800">
                              <XCircle className="w-3 h-3" /> Errors
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-[11px] text-rose-700 max-w-xs">
                          {row.errors.length > 0 && <div>❌ {row.errors.join('; ')}</div>}
                          {row.warnings.length > 0 && <div className="text-amber-700">⚠️ {row.warnings.join('; ')}</div>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Single Student Manual Entry Form */}
      {activeTab === 'single' && (
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm max-w-4xl mx-auto">
          {singleSuccess && (
            <div className="mb-6 bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-lg text-xs font-medium text-emerald-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{singleSuccess}</span>
            </div>
          )}

          <form onSubmit={handleSingleSubmit} className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-1">Student Identity Details</h3>
              <p className="text-xs text-slate-500 mb-4">Mandatory 12-digit APAAR and student identification credentials</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    APAAR ID (12 Numeric Digits) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={12}
                    value={formData.apaar_id}
                    onChange={(e) => setFormData({ ...formData, apaar_id: e.target.value.replace(/\D/g, '') })}
                    placeholder="e.g. 100000000101"
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-aicte-navy focus:border-transparent"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Exactly 12 digits issued under Automated Permanent Academic Account Registry</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Institutional Student ID / Roll No <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.student_id}
                    onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                    placeholder="e.g. IITD-CS-2024-001"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-aicte-navy focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Student Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-aicte-navy focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Date of Birth <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-aicte-navy focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-aicte-navy focus:border-transparent"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nationality</label>
                  <input
                    type="text"
                    value={formData.nationality}
                    onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-aicte-navy focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-base font-bold text-slate-900 mb-1">Academic & Quota Allocation</h3>
              <p className="text-xs text-slate-500 mb-4">Course, branch, and category quota parameters</p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Course</label>
                  <select
                    value={formData.course}
                    onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-aicte-navy focus:border-transparent"
                  >
                    <option value="B.Tech">B.Tech</option>
                    <option value="M.Tech">M.Tech</option>
                    <option value="MCA">MCA</option>
                    <option value="MBA">MBA</option>
                    <option value="Diploma">Diploma</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Branch / Specialization</label>
                  <input
                    type="text"
                    required
                    value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                    placeholder="e.g. Computer Science and Engineering"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-aicte-navy focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Admission Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-aicte-navy focus:border-transparent"
                  >
                    <option value="General">General</option>
                    <option value="OBC">OBC</option>
                    <option value="SC">SC</option>
                    <option value="ST">ST</option>
                    <option value="EWS">EWS</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Admission Quota</label>
                  <select
                    value={formData.quota}
                    onChange={(e) => setFormData({ ...formData, quota: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-aicte-navy focus:border-transparent"
                  >
                    <option value="Regular">Regular (Counts towards Intake Cap)</option>
                    <option value="Supernumerary">Supernumerary (Exempt from Cap)</option>
                    <option value="NRI">NRI Quota</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Admission Date</label>
                  <input
                    type="date"
                    required
                    value={formData.admission_date}
                    onChange={(e) => setFormData({ ...formData, admission_date: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-aicte-navy focus:border-transparent"
                  />
                </div>
              </div>

              {/* Checkboxes: OCI, FN, Consent */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.oci_status}
                    onChange={(e) => setFormData({ ...formData, oci_status: e.target.checked })}
                    className="rounded border-slate-300 text-aicte-navy focus:ring-aicte-navy"
                  />
                  <span>OCI Card Holder</span>
                </label>

                <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.foreign_national}
                    onChange={(e) => setFormData({ ...formData, foreign_national: e.target.checked })}
                    className="rounded border-slate-300 text-aicte-navy focus:ring-aicte-navy"
                  />
                  <span>Foreign National Candidate</span>
                </label>

                <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.consent_flag}
                    onChange={(e) => setFormData({ ...formData, consent_flag: e.target.checked })}
                    className="rounded border-slate-300 text-aicte-navy focus:ring-aicte-navy"
                  />
                  <span className="font-semibold text-emerald-800">Student Consent Granted (IT Act 43A)</span>
                </label>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={singleSubmitting}
                className="px-6 py-2.5 text-xs font-bold rounded-lg bg-aicte-navy hover:bg-slate-900 text-white shadow transition flex items-center gap-2"
              >
                {singleSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4 text-aicte-saffron" />}
                <span>{singleSubmitting ? 'Validating & Submitting...' : 'Register Student in Central Repository'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </Layout>
  );
};
