import React, { useState } from 'react';
import { Search, LayoutDashboard, FileText, BarChart2, Settings, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

const SIDEBAR_ICONS = [
  { icon: LayoutDashboard, path: '/theme-demo', label: 'Dashboard' },
  { icon: FileText, path: '/theme-demo', label: 'Documents' },
  { icon: BarChart2, path: '/theme-demo', label: 'Analytics' },
  { icon: Settings, path: '/theme-demo', label: 'Settings' },
];

export default function ThemeDemoLayout({ children }) {
  const [searchQuery, setSearchQuery] = useState('');

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="flex overflow-hidden font-sans h-screen bg-slate-50">
      {/* Narrow fixed sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 w-16 flex flex-col bg-white border-r border-slate-200 shrink-0">
        <div className="flex flex-col items-center py-4 gap-1">
          <Link
            to="/"
            className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            aria-label="Home"
          >
            <Home size={20} strokeWidth={1.5} />
          </Link>
        </div>
        <nav className="flex-1 flex flex-col items-center pt-6 gap-1">
          {SIDEBAR_ICONS.map(({ icon: Icon, path, label }) => (
            <Link
              key={label}
              to={path}
              className="w-10 h-10 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
              aria-label={label}
            >
              <Icon size={20} strokeWidth={1.5} />
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-16 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-8 py-10">
          {/* Header: greeting + pill search */}
          <div className="mb-10">
            <h1 className="text-2xl font-semibold text-slate-800 mb-6">
              {greeting()}, Guest
            </h1>
            <div className="flex justify-center max-w-xl mx-auto">
              <div className="relative w-full">
                <Search
                  size={20}
                  className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"
                  strokeWidth={1.5}
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search…"
                  className="w-full py-3 pl-12 pr-5 rounded-full border border-slate-200 bg-white text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-1 focus:ring-slate-300 focus:border-slate-300"
                />
              </div>
            </div>
          </div>

          {children}
        </div>
      </main>
    </div>
  );
}
