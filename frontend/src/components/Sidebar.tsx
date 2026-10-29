import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  UploadCloud,
  Users,
  AlertTriangle,
  Activity,
  FileCheck2,
  FileBarChart2,
  History,
  Code2,
  ShieldAlert,
  Building2
} from 'lucide-react';

interface SidebarProps {
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, setMobileOpen }) => {
  const { user } = useAuth();
  if (!user) return null;

  const role = user.role;

  const aicteNavItems = [
    { to: '/aicte-dashboard', label: 'National Dashboard', icon: LayoutDashboard },
    { to: '/anomalies', label: 'Anomaly Detection', icon: Activity },
    { to: '/validation', label: 'Validation & Flags', icon: AlertTriangle },
    { to: '/records', label: 'Student Registry', icon: Users },
    { to: '/reports', label: 'Reports & Analytics', icon: FileBarChart2 },
    { to: '/audit', label: 'Audit Trail', icon: History },
    { to: '/api-docs', label: 'API & ERP Integration', icon: Code2 },
  ];

  const institutionNavItems = [
    { to: '/institution-dashboard', label: 'Institution Dashboard', icon: LayoutDashboard },
    { to: '/upload', label: 'Student Data Upload', icon: UploadCloud },
    { to: '/records', label: 'Student Records', icon: Users },
    { to: '/validation', label: 'Validation Results', icon: AlertTriangle },
    { to: '/reports', label: 'Institutional Reports', icon: FileBarChart2 },
    { to: '/verify', label: 'Verify Record / QR', icon: FileCheck2 },
    { to: '/api-docs', label: 'ERP Integration Docs', icon: Code2 },
  ];

  const verifierNavItems = [
    { to: '/verify', label: 'Verification Portal', icon: FileCheck2 },
    { to: '/records', label: 'Search Registry', icon: Users },
    { to: '/api-docs', label: 'Verification API', icon: Code2 },
  ];

  const navItems = role === 'aicte_admin'
    ? aicteNavItems
    : role === 'institution_admin'
    ? institutionNavItems
    : verifierNavItems;

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-slate-200 flex flex-col pt-20 transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* Institution / Role Indicator Header */}
      <div className="px-4 py-3 bg-slate-950/60 border-b border-slate-800">
        <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Active Workspace</p>
        <p className="text-sm font-semibold text-white truncate">
          {role === 'aicte_admin' && 'AICTE Central Authority'}
          {role === 'institution_admin' && (user.institution_name || 'Institution Portal')}
          {role === 'verifier' && 'Authorized Verifier Portal'}
        </p>
      </div>

      {/* Nav list */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen && setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition ${
                  isActive
                    ? 'bg-aicte-saffron text-slate-950 font-bold shadow-md'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Information Card */}
      <div className="p-4 bg-slate-950/40 border-t border-slate-800">
        <div className="bg-slate-800/80 rounded-lg p-3 text-xs border border-slate-700/50">
          <div className="flex items-center gap-2 text-aicte-saffron font-semibold mb-1">
            <Building2 className="w-3.5 h-3.5" />
            <span>AICTE Smart Hub</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            One Nation One Student ID (APAAR) verification engine. All writes auditable.
          </p>
        </div>
      </div>
    </aside>
  );
};
