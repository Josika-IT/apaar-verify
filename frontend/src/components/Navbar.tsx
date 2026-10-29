import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, LogOut, User as UserIcon, ExternalLink, QrCode, FileText, Bell } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="bg-aicte-navy text-white shadow-md border-b-2 border-aicte-saffron sticky top-0 z-40">
      {/* Top micro banner */}
      <div className="bg-slate-900/40 text-xs px-4 py-1 flex items-center justify-between text-slate-300 border-b border-white/10">
        <div className="flex items-center space-x-3">
          <span>भारत सरकार | Government of India</span>
          <span>•</span>
          <span>अखिल भारतीय तकनीकी शिक्षा परिषद | AICTE</span>
        </div>
        <div className="hidden sm:flex items-center space-x-4">
          <Link to="/verify" className="hover:text-aicte-saffron transition flex items-center gap-1">
            <QrCode className="w-3.5 h-3.5" /> Public Verifier
          </Link>
          <a href="/docs" target="_blank" rel="noreferrer" className="hover:text-aicte-saffron transition flex items-center gap-1">
            <ExternalLink className="w-3.5 h-3.5" /> API Docs
          </a>
        </div>
      </div>

      {/* Main navigation */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link to="/" className="flex items-center space-x-3 group">
            {/* National Emblem / Ashoka Chakra Symbol */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-aicte-saffron to-amber-400 p-0.5 shadow-inner flex items-center justify-center">
              <div className="w-full h-full rounded-full bg-aicte-navy flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-aicte-saffron group-hover:scale-110 transition" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white">APAAR-Verify</span>
                <span className="bg-aicte-saffron/20 border border-aicte-saffron/40 text-amber-300 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  SIH 26263
                </span>
              </div>
              <p className="text-[11px] text-slate-300 hidden sm:block">AICTE Student Data Management & Verification Portal</p>
            </div>
          </Link>
        </div>

        <div className="flex items-center space-x-3 sm:space-x-4">
          {isAuthenticated && user ? (
            <div className="flex items-center space-x-3">
              {/* Role badge */}
              <div className="hidden md:flex flex-col items-end">
                <span className="text-sm font-semibold text-white">{user.full_name}</span>
                <span className="text-[11px] text-emerald-300 font-medium">
                  {user.role === 'aicte_admin' && '🏛️ AICTE Central Admin'}
                  {user.role === 'institution_admin' && `🏫 ${user.institution_name || 'Institution Admin'}`}
                  {user.role === 'verifier' && '🔍 Employer / Verifier'}
                </span>
              </div>

              {/* Action buttons */}
              <Link
                to="/verify"
                className="bg-aicte-blue hover:bg-slate-700 text-white text-xs px-3 py-1.5 rounded-md flex items-center gap-1.5 border border-white/20 transition"
              >
                <QrCode className="w-4 h-4 text-aicte-saffron" />
                <span className="hidden sm:inline">Verify Record</span>
              </Link>

              <button
                onClick={logout}
                title="Sign Out"
                className="bg-red-950/60 hover:bg-red-800 text-red-200 hover:text-white px-3 py-1.5 rounded-md text-xs flex items-center gap-1 border border-red-700/50 transition"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                to="/verify"
                className="text-xs font-medium text-slate-200 hover:text-white px-3 py-1.5 rounded-md hover:bg-white/10 transition flex items-center gap-1"
              >
                <QrCode className="w-4 h-4 text-aicte-saffron" /> Verify Publicly
              </Link>
              <Link
                to="/login"
                className="bg-gradient-to-r from-aicte-saffron to-amber-600 hover:from-amber-500 hover:to-amber-700 text-slate-950 font-bold text-xs px-4 py-1.5 rounded-md shadow transition"
              >
                Portal Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
