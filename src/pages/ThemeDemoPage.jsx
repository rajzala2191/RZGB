import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import ThemeDemoLayout from '@/components/ThemeDemoLayout';

const MOCK_ASSIGNMENTS = [
  { id: 1, title: 'Q1 Budget Review', progress: 85, status: 'Due in 2 days', overdue: false },
  { id: 2, title: 'Vendor Onboarding Checklist', progress: 45, status: 'Due in 1 week', overdue: false },
  { id: 3, title: 'Compliance Audit Prep', progress: 100, status: 'Completed', overdue: false },
  { id: 4, title: 'Contract Renewal', progress: 30, status: 'Overdue', overdue: true },
];

const MOCK_RECENT = [
  { id: 1, title: 'Annual Report 2024', subtitle: 'Finance & Operations' },
  { id: 2, title: 'Supplier Evaluation', subtitle: 'Procurement' },
  { id: 3, title: 'Risk Assessment Q2', subtitle: 'Compliance' },
  { id: 4, title: 'Product Roadmap', subtitle: 'Strategy' },
];

const MOCK_LINE_DATA = [
  { date: 'Mon', value: 42 },
  { date: 'Tue', value: 58 },
  { date: 'Wed', value: 51 },
  { date: 'Thu', value: 67 },
  { date: 'Fri', value: 73 },
  { date: 'Sat', value: 45 },
  { date: 'Sun', value: 52 },
];

const MOCK_BAR_DATA = [
  { name: 'Project Alpha', value: 94 },
  { name: 'Project Beta', value: 87 },
  { name: 'Project Gamma', value: 76 },
  { name: 'Project Delta', value: 82 },
  { name: 'Project Epsilon', value: 91 },
];

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-sm text-sm">
      <p className="text-slate-500 mb-1">{label}</p>
      <p className="font-semibold text-slate-800">{payload[0].value}</p>
    </div>
  );
}

export default function ThemeDemoPage() {
  return (
    <ThemeDemoLayout>
      <div className="space-y-10">
        {/* Assignments */}
        <section className="bg-white rounded-xl border border-slate-200 p-8">
          <h2 className="text-lg font-semibold text-slate-800 mb-6">Assignments</h2>
          <ul className="space-y-10">
            {MOCK_ASSIGNMENTS.map((a) => (
              <li key={a.id} className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-800">{a.title}</span>
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      a.overdue ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {a.status}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${a.progress}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Recent */}
        <section>
          <h2 className="text-lg font-semibold text-slate-800 mb-6">Recent</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {MOCK_RECENT.map((item) => (
              <article
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden"
              >
                <div className="aspect-[4/3] bg-slate-200 rounded-t-2xl" />
                <div className="p-5">
                  <h3 className="font-semibold text-slate-800">{item.title}</h3>
                  <p className="text-sm text-slate-500 mt-1">{item.subtitle}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Insights */}
        <section className="bg-sky-50 rounded-xl border border-slate-200 p-8">
          <h2 className="text-lg font-semibold text-slate-800 mb-6">Insights</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h3 className="text-sm font-medium text-slate-600 mb-4">Performance overview</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={MOCK_LINE_DATA} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.3} vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#94a3b8', strokeWidth: 1 }} />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#059669"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, fill: '#059669', strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-600 mb-4">Top Performing</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={MOCK_BAR_DATA} layout="vertical" margin={{ left: 80 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.3} horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      width={75}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(148,163,184,0.1)' }} />
                    <Bar dataKey="value" fill="#059669" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </section>
      </div>
    </ThemeDemoLayout>
  );
}
