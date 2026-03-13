import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { fetchAllWorkspaces, fetchAllPlatformStats } from '@/services/workspaceService';
import { fetchDemoRequests } from '@/services/demoRequestService';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import {
  Building2, Users, ShoppingCart, Mail, ChevronRight,
  Loader2, TrendingUp, Activity,
} from 'lucide-react';
import { format, subDays, startOfDay } from 'date-fns';
import { SURFACE } from '@/lib/theme';

/* ─── Stat card ─────────────────────────────────────────── */
function StatCard({ title, value, icon: Icon, sub, onClick }) {
  return (
    <motion.div
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      onClick={onClick}
      className={onClick ? 'cursor-pointer' : ''}
      style={{
        background: SURFACE.bg,
        border: `1px solid ${SURFACE.edge}`,
        borderRadius: 14,
        padding: '20px 20px 18px',
      }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p
            className="text-[10px] font-bold uppercase tracking-[0.12em] mb-2"
            style={{ color: SURFACE.caption }}
          >
            {title}
          </p>
          <p className="text-3xl font-black leading-none" style={{ color: SURFACE.heading }}>
            {value ?? '—'}
          </p>
          {sub && (
            <p className="text-xs mt-1.5" style={{ color: SURFACE.caption }}>
              {sub}
            </p>
          )}
        </div>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: SURFACE.raised, border: `1px solid ${SURFACE.edge}` }}
        >
          <Icon size={15} style={{ color: SURFACE.body }} />
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Custom tooltip for recharts ──────────────────────── */
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: SURFACE.raised,
        border: `1px solid ${SURFACE.edge}`,
        borderRadius: 8,
        padding: '8px 12px',
        fontSize: 12,
      }}
    >
      <p style={{ color: SURFACE.caption, marginBottom: 2 }}>{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: SURFACE.heading, fontWeight: 700 }}>
          {p.value} {p.name}
        </p>
      ))}
    </div>
  );
}

/* ─── Section card wrapper ──────────────────────────────── */
function SectionCard({ title, action, onAction, children, style }) {
  return (
    <div
      style={{
        background: SURFACE.bg,
        border: `1px solid ${SURFACE.edge}`,
        borderRadius: 14,
        padding: 20,
        ...style,
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-bold" style={{ color: SURFACE.heading }}>{title}</p>
        {action && (
          <button
            onClick={onAction}
            className="text-xs font-semibold flex items-center gap-1"
            style={{ color: SURFACE.caption }}
          >
            {action} <ChevronRight size={11} />
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

/* ─── Role colors for pie chart ─────────────────────────── */
const ROLE_COLORS = {
  super_admin: 'var(--heading)',
  admin:       '#64748b',
  client:      '#94a3b8',
  supplier:    '#cbd5e1',
};

/* ─── Main component ────────────────────────────────────── */
export default function PlatformDashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({});
  const [workspaces, setWorkspaces] = useState([]);
  const [demoRequests, setDemoRequests] = useState([]);
  const [activityData, setActivityData] = useState([]);
  const [roleData, setRoleData] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, wsRes, demoRes, ordersRes, profilesRes] = await Promise.all([
        fetchAllPlatformStats(),
        fetchAllWorkspaces(),
        fetchDemoRequests().catch(() => []),
        supabaseAdmin
          .from('orders')
          .select('id, created_at, status')
          .order('created_at', { ascending: false })
          .limit(200),
        supabaseAdmin
          .from('profiles')
          .select('id, role, company_name, email, created_at')
          .order('created_at', { ascending: false }),
      ]);

      setStats(statsRes);
      if (wsRes.data) setWorkspaces(wsRes.data);
      setDemoRequests(Array.isArray(demoRes) ? demoRes : []);

      // Build 14-day activity chart
      const orders = ordersRes.data || [];
      const days = Array.from({ length: 14 }, (_, i) => {
        const d = startOfDay(subDays(new Date(), 13 - i));
        const label = format(d, 'MMM d');
        const count = orders.filter(o => {
          const od = startOfDay(new Date(o.created_at));
          return od.getTime() === d.getTime();
        }).length;
        return { date: label, orders: count };
      });
      setActivityData(days);

      // Build role distribution for pie
      const profiles = profilesRes.data || [];
      const roleCounts = profiles.reduce((acc, p) => {
        const r = p.role || 'client';
        acc[r] = (acc[r] || 0) + 1;
        return acc;
      }, {});
      setRoleData(
        Object.entries(roleCounts).map(([name, value]) => ({ name, value }))
      );

      // Recent activity feed (latest 8 profiles joined)
      setRecentActivity(profiles.slice(0, 8));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-40">
        <Loader2 className="animate-spin" size={28} style={{ color: SURFACE.caption }} />
      </div>
    );
  }

  const pendingDemos = demoRequests.filter(r => r.status === 'pending');

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <p
          className="text-[10px] font-bold uppercase tracking-[0.14em] mb-1"
          style={{ color: SURFACE.caption }}
        >
          Platform Overview
        </p>
        <h1 className="text-2xl font-black tracking-tight" style={{ color: SURFACE.heading }}>
          Dashboard
        </h1>
        <p className="text-sm mt-0.5" style={{ color: SURFACE.caption }}>
          Cross-tenant metrics and workspace health
        </p>
      </div>

      {/* Row 1 — 4 stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Workspaces"
          value={stats.workspaces}
          icon={Building2}
          sub={`${workspaces.filter(w => w.status === 'active').length} active`}
        />
        <StatCard
          title="Total Users"
          value={stats.users}
          icon={Users}
          sub="across all tenants"
        />
        <StatCard
          title="Total Orders"
          value={stats.orders}
          icon={ShoppingCart}
          sub="lifetime"
        />
        <StatCard
          title="Pending Demos"
          value={pendingDemos.length}
          icon={Mail}
          sub="awaiting approval"
          onClick={() => navigate('/platform-admin/demo-requests')}
        />
      </div>

      {/* Row 2 — Activity chart + Role pie */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Activity line chart (3 cols) */}
        <SectionCard
          title="Platform Activity — Orders (14 days)"
          style={{ gridColumn: 'span 3' }}
        >
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={activityData} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--edge)"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: 'var(--caption)' }}
                  axisLine={false}
                  tickLine={false}
                  interval={2}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: 'var(--caption)' }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'var(--edge-strong)', strokeWidth: 1 }} />
                <Line
                  type="monotone"
                  dataKey="orders"
                  name="orders"
                  stroke="var(--heading)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: 'var(--heading)', strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        {/* Role distribution pie (1 col) */}
        <SectionCard title="User Roles">
          <div style={{ height: 220 }}>
            {roleData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={roleData}
                    cx="50%"
                    cy="45%"
                    innerRadius={52}
                    outerRadius={72}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {roleData.map(entry => (
                      <Cell
                        key={entry.name}
                        fill={ROLE_COLORS[entry.name] || '#94a3b8'}
                        stroke="none"
                      />
                    ))}
                  </Pie>
                  <Legend
                    iconType="circle"
                    iconSize={7}
                    formatter={v => (
                      <span style={{ fontSize: 10, color: 'var(--caption)' }}>{v}</span>
                    )}
                  />
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-xs" style={{ color: SURFACE.caption }}>No data</p>
              </div>
            )}
          </div>
        </SectionCard>
      </div>

      {/* Row 3 — Recent workspaces + Activity feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Workspaces */}
        <SectionCard
          title="Recent Workspaces"
          action="View all"
          onAction={() => navigate('/platform-admin/workspaces')}
        >
          <div className="space-y-1">
            {workspaces.slice(0, 6).map(ws => (
              <div
                key={ws.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors"
                style={{ border: '1px solid transparent' }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'var(--surface-raised)';
                  e.currentTarget.style.borderColor = 'var(--edge)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderColor = 'transparent';
                }}
                onClick={() => navigate('/platform-admin/workspaces')}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold"
                  style={{ background: 'var(--surface-raised)', border: '1px solid var(--edge)', color: 'var(--heading)' }}
                >
                  {(ws.name || 'W').slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: SURFACE.heading }}>
                    {ws.name}
                  </p>
                  <p className="text-[11px]" style={{ color: SURFACE.caption }}>
                    {ws.slug} · {format(new Date(ws.created_at), 'dd MMM yyyy')}
                  </p>
                </div>
                <span
                  className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
                  style={{
                    background: ws.status === 'active' ? 'rgba(16,185,129,0.08)' : 'var(--surface-raised)',
                    color: ws.status === 'active' ? '#10b981' : SURFACE.caption,
                    border: `1px solid ${ws.status === 'active' ? 'rgba(16,185,129,0.2)' : 'var(--edge)'}`,
                  }}
                >
                  {ws.status}
                </span>
              </div>
            ))}
            {workspaces.length === 0 && (
              <p className="text-xs py-4 text-center" style={{ color: SURFACE.caption }}>
                No workspaces yet
              </p>
            )}
          </div>
        </SectionCard>

        {/* Latest Users / Activity feed */}
        <SectionCard
          title="Latest Users"
          action="View all"
          onAction={() => navigate('/platform-admin/users')}
        >
          <div className="space-y-1">
            {recentActivity.map(profile => (
              <div
                key={profile.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold"
                  style={{ background: 'var(--surface-raised)', border: '1px solid var(--edge)', color: 'var(--heading)' }}
                >
                  {(profile.company_name || profile.email || 'U').slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: SURFACE.heading }}>
                    {profile.company_name || profile.email}
                  </p>
                  <p className="text-[11px]" style={{ color: SURFACE.caption }}>
                    {profile.role} · joined {format(new Date(profile.created_at), 'dd MMM yyyy')}
                  </p>
                </div>
                <span
                  className="text-[10px] font-medium uppercase tracking-wide"
                  style={{ color: SURFACE.faint }}
                >
                  {profile.role?.replace('_', ' ')}
                </span>
              </div>
            ))}
            {recentActivity.length === 0 && (
              <p className="text-xs py-4 text-center" style={{ color: SURFACE.caption }}>
                No users yet
              </p>
            )}
          </div>
        </SectionCard>
      </div>

      {/* Pending demo requests preview */}
      {pendingDemos.length > 0 && (
        <SectionCard
          title={`Pending Demo Requests (${pendingDemos.length})`}
          action="Manage all"
          onAction={() => navigate('/platform-admin/demo-requests')}
        >
          <div className="space-y-1">
            {pendingDemos.slice(0, 5).map(r => (
              <div
                key={r.id}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                style={{ background: 'var(--surface-raised)', border: '1px solid var(--edge)' }}
              >
                <div className="flex items-center gap-3">
                  <Mail size={13} style={{ color: SURFACE.caption }} />
                  <span className="text-sm font-medium" style={{ color: SURFACE.heading }}>{r.email}</span>
                </div>
                <span className="text-xs" style={{ color: SURFACE.caption }}>
                  {format(new Date(r.requested_at), 'dd MMM yyyy, HH:mm')}
                </span>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}
