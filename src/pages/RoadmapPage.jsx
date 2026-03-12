import React from 'react';
import { Link } from 'react-router-dom';
import { Map, ArrowLeft } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';

export default function RoadmapPage() {
  return (
    <div className="min-h-screen font-sans antialiased" style={{ fontFamily: "'DM Sans', sans-serif", background: 'var(--app-bg)' }}>
      <nav className="border-b" style={{ background: 'var(--header-bg)', borderColor: 'var(--header-border)' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link to="/landing" className="flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-80" style={{ color: 'var(--body)' }}>
            <ArrowLeft size={16} /> Back to Home
          </Link>
          <ThemeToggle />
        </div>
      </nav>
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-orange-100 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/50 flex items-center justify-center mx-auto mb-6">
          <Map className="w-8 h-8 text-orange-500" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black mb-3" style={{ color: 'var(--heading)' }}>
          Product Roadmap
        </h1>
        <p className="mb-8" style={{ color: 'var(--body)' }}>
          Our public roadmap is coming soon. We’re prioritising core procurement, manufacturing process engine, and enterprise features.
        </p>
        <Link
          to="/landing"
          className="inline-flex items-center gap-2 bg-[#FF6B35] hover:bg-orange-500 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors"
        >
          Back to Home
        </Link>
      </main>
    </div>
  );
}
