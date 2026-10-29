import React, { useState } from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { Menu, X, Shield, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actionButton?: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children, title, subtitle, actionButton }) => {
  const { isAuthenticated } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <Navbar />

      {/* Main app container with sidebar */}
      <div className="flex-1 flex">
        {isAuthenticated && (
          <>
            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="md:hidden fixed bottom-4 right-4 z-50 bg-aicte-navy text-white p-3 rounded-full shadow-2xl border border-aicte-saffron focus:outline-none"
              aria-label="Toggle navigation"
            >
              {mobileSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Sidebar */}
            <Sidebar mobileOpen={mobileSidebarOpen} setMobileOpen={setMobileSidebarOpen} />

            {/* Backdrop on mobile */}
            {mobileSidebarOpen && (
              <div
                onClick={() => setMobileSidebarOpen(false)}
                className="fixed inset-0 bg-black/50 z-20 md:hidden"
              />
            )}
          </>
        )}

        {/* Content area */}
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Header section if title provided */}
          {title && (
            <div className="bg-white border-b border-slate-200 px-4 sm:px-8 py-5 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
                  {subtitle && <p className="text-xs sm:text-sm text-slate-500 mt-0.5">{subtitle}</p>}
                </div>
                {actionButton && <div>{actionButton}</div>}
              </div>
            </div>
          )}

          <div className="p-4 sm:p-8 flex-1">
            {children}
          </div>

          {/* Portal Footer */}
          <footer className="mt-auto bg-white border-t border-slate-200 py-4 px-6 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-aicte-navy" />
              <span>APAAR-Verify Platform • All India Council for Technical Education (AICTE)</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/api-docs" className="hover:text-aicte-navy transition">API Integration</Link>
              <span>•</span>
              <a href="/docs" target="_blank" rel="noreferrer" className="hover:text-aicte-navy transition flex items-center gap-1">
                FastAPI Swagger <ExternalLink className="w-3 h-3" />
              </a>
              <span>•</span>
              <span>Smart Automation SIH 26263</span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};
