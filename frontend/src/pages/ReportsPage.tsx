import React from 'react';
import { Layout } from '../components/Layout';
import { api } from '../services/api';
import {
  FileBarChart2,
  Download,
  FileSpreadsheet,
  FileText,
  AlertTriangle,
  Building2,
  Users2,
  Award,
  CheckCircle2
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const reports = [
    {
      id: 'enrolment-summary',
      title: 'National Enrolment & Capacity Utilization Summary',
      description: 'Comprehensive institution-wise breakdown of sanctioned intake, regular enrolment, supernumerary quotas, and capacity utilization percentage across all states.',
      icon: Building2,
      color: 'blue'
    },
    {
      id: 'excess-intake',
      title: 'Statutory Intake Quota Violations Audit',
      description: 'Audit dossier listing institutions admitting students beyond AICTE approved intake thresholds, calculated overflow numbers, and statistical risk scores.',
      icon: AlertTriangle,
      color: 'rose'
    },
    {
      id: 'duplicates',
      title: 'National Duplicate APAAR Conflict Register',
      description: 'Complete log of dual-institution and internal duplicate APAAR ID registrations flagged by cross-validation algorithms, identifying potential phantom enrolments.',
      icon: Users2,
      color: 'amber'
    },
    {
      id: 'accreditation',
      title: 'Institutional Accreditation & Compliance Dossier',
      description: 'Official compliance summary covering reservation category demographics, NRI/foreign student allocations, and Section 43A IT Act student consent adherence.',
      icon: Award,
      color: 'emerald'
    }
  ];

  return (
    <Layout
      title="Official Reports & Regulatory Export Center"
      subtitle="Export signed statutory compliance audits and national analytics in standardized CSV and PDF formats"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
        {reports.map((rep) => {
          const Icon = rep.icon;
          return (
            <div
              key={rep.id}
              className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition"
            >
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-aicte-navy">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 leading-snug">{rep.title}</h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{rep.description}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Available Formats
                </span>

                <div className="flex items-center gap-2">
                  <a
                    href={api.getReportExportUrl(rep.id, 'csv')}
                    download
                    className="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 transition flex items-center gap-1.5"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>CSV</span>
                  </a>

                  <a
                    href={api.getReportExportUrl(rep.id, 'pdf')}
                    download
                    className="px-3 py-1.5 text-xs font-bold rounded-lg bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-300 transition flex items-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>PDF</span>
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Layout>
  );
};
