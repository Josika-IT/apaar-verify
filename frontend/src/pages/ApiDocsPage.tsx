import React from 'react';
import { Layout } from '../components/Layout';
import {
  Code2,
  ExternalLink,
  Terminal,
  ShieldCheck,
  CheckCircle2,
  Copy,
  BookOpen,
  KeyRound
} from 'lucide-react';

export const ApiDocsPage: React.FC = () => {
  return (
    <Layout
      title="ERP Integration & API Documentation"
      subtitle="Connect campus ERPs, state admission counseling portals, and AICTE registries to APAAR-Verify"
    >
      {/* Top Banner with Direct Swagger Links */}
      <div className="bg-gradient-to-r from-aicte-navy to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-md border border-slate-700 mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-aicte-saffron text-xs font-semibold mb-2">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Interactive OpenAPI 3.1 Specification</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">FastAPI Interactive Swagger & Schema</h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Test live endpoints directly in your browser with automated request validation and payload schemas.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/docs"
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2.5 rounded-xl bg-aicte-saffron hover:bg-amber-500 text-slate-950 font-bold text-xs shadow transition flex items-center gap-1.5"
          >
            <span>Swagger UI (/docs)</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <a
            href="/redoc"
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition flex items-center gap-1.5"
          >
            <span>ReDoc (/redoc)</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Integration Guide Section */}
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Authentication */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2 font-bold text-slate-900 text-base">
            <KeyRound className="w-5 h-5 text-aicte-navy" />
            <span>1. Bearer Token Authentication</span>
          </div>
          <p className="text-xs text-slate-600 mb-3">
            All institutional and admin endpoints require an HTTP Authorization header containing a signed JWT token:
          </p>
          <pre className="bg-slate-900 text-slate-100 p-3 rounded-lg text-xs font-mono overflow-x-auto">
            Authorization: Bearer &lt;access_token&gt;
          </pre>
        </div>

        {/* Endpoint 1: Verify Student Record */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2 font-bold text-slate-900 text-base">
            <Terminal className="w-5 h-5 text-emerald-600" />
            <span>2. Public Verification Endpoint</span>
          </div>
          <p className="text-xs text-slate-600 mb-3">
            Query the AICTE central repository using a 12-digit APAAR ID. Returns verification status and consent-gated academic parameters:
          </p>

          <div className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-xs overflow-x-auto">
            <div className="text-emerald-400 font-bold mb-2">GET /api/v1/verify/{'{apaar_id}'}</div>
            <div className="text-slate-400"># Example Response (200 OK)</div>
            <pre className="text-amber-300 mt-1">{`{
  "is_valid": true,
  "apaar_id": "889911223344",
  "student_id_masked": "IIT-***-098",
  "name_masked": "A****** V****",
  "dob_masked": "****-**-14",
  "institution_name": "Indian Institute of Technology Delhi (IITD)",
  "aicte_code": "1-332456781",
  "course": "B.Tech",
  "branch": "Computer Science and Engineering",
  "year_of_study": 1,
  "admission_date": "2024-08-10",
  "verification_status": "Verified",
  "consent_granted": true,
  "consent_notice": "Student has granted authenticated consent for public credential verification under Section 43A of IT Act.",
  "verification_timestamp": "2026-10-29 16:30:00 UTC"
}`}</pre>
          </div>
        </div>

        {/* Endpoint 2: Bulk CSV Upload */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2 font-bold text-slate-900 text-base">
            <Terminal className="w-5 h-5 text-amber-600" />
            <span>3. ERP Admissions Sync Endpoint</span>
          </div>
          <p className="text-xs text-slate-600 mb-3">
            Campus ERP systems (e.g., SAP Campus Management, TCS iON, Edusys) can stream multipart/form-data CSV or XLSX files:
          </p>

          <div className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-xs overflow-x-auto">
            <div className="text-amber-400 font-bold mb-2">POST /api/v1/students/bulk?preview_only=false</div>
            <div className="text-slate-400 mb-2">curl -X POST "http://localhost:8000/api/v1/students/bulk" \</div>
            <div className="text-slate-400 mb-2">  -H "Authorization: Bearer $TOKEN" \</div>
            <div className="text-slate-400 mb-2">  -F "file=@admissions_batch_2024.csv"</div>
          </div>
        </div>

        {/* Endpoint 3: Verifiable PDF Record */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2 font-bold text-slate-900 text-base">
            <Terminal className="w-5 h-5 text-purple-600" />
            <span>4. Verifiable PDF Document Generation (Requirement 10)</span>
          </div>
          <p className="text-xs text-slate-600 mb-3">
            Downloads official tamper-evident PDF with QR code and prominent APAAR ID printed beside student ID:
          </p>

          <div className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-xs overflow-x-auto">
            <div className="text-purple-400 font-bold mb-2">GET /records/{'{apaar_id}'}/pdf</div>
            <div className="text-slate-400">Content-Type: application/pdf</div>
            <div className="text-slate-400">Content-Disposition: inline; filename=APAAR_Record_889911223344.pdf</div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
