"use client";

import {
  DollarSign,
  Briefcase,
  Users,
  TrendingUp,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import KpiCard from "@/components/KpiCard";
import PageHeader from "@/components/PageHeader";
import HydrationGate from "@/components/HydrationGate";
import EmptyState from "@/components/EmptyState";
import { useTracker } from "@/lib/store";
import {
  calcARR,
  calcMRR,
  compactCurrency,
  currency,
  monthlyRevenueSeries,
  mrrSeries,
  targetProgress,
  totalRevenue,
} from "@/lib/metrics";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";

export default function DashboardPage() {
  return (
    <HydrationGate
      fallback={<div className="text-sm text-slate-400">Loading…</div>}
    >
      <Dashboard />
    </HydrationGate>
  );
}

function Dashboard() {
  const {
    projects,
    customers,
    revenue,
    targets,
    seedDemo,
    load,
    saving,
    loading,
  } = useTracker();

  const mrr = calcMRR(customers);
  const arr = calcARR(customers);
  const total = totalRevenue(revenue);
  const activeCustomers = customers.filter((c) => c.status === "active").length;
  const activeProjects = projects.filter((p) => p.status === "active").length;

  const isEmpty =
    projects.length === 0 &&
    customers.length === 0 &&
    revenue.length === 0 &&
    targets.length === 0;

  const revSeries = monthlyRevenueSeries(revenue, 12);
  const mrrSer = mrrSeries(customers, 12);

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Synced live with your Google Sheet."
        actions={
          <>
            <button
              onClick={() => load()}
              className="btn-secondary"
              disabled={loading || saving}
              title="Refresh from Google Sheets"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
            {isEmpty && (
              <button
                onClick={seedDemo}
                className="btn-primary"
                disabled={saving}
              >
                <Sparkles className="h-4 w-4" />
                {saving ? "Loading…" : "Load sample data"}
              </button>
            )}
          </>
        }
      />

      {isEmpty ? (
        <EmptyState
          icon={<Sparkles className="h-5 w-5" />}
          title="Welcome to your tracker"
          description="Your Google Sheet is connected. Add customers and projects, or load sample data to see how it works."
          action={
            <button
              onClick={seedDemo}
              className="btn-primary"
              disabled={saving}
            >
              {saving ? "Loading…" : "Load sample data"}
            </button>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              label="MRR"
              value={currency(mrr)}
              icon={<TrendingUp className="h-5 w-5" />}
              hint={`${activeCustomers} active customers`}
              accent="indigo"
            />
            <KpiCard
              label="ARR"
              value={currency(arr)}
              icon={<DollarSign className="h-5 w-5" />}
              hint="MRR × 12"
              accent="emerald"
            />
            <KpiCard
              label="Total Revenue"
              value={currency(total)}
              icon={<DollarSign className="h-5 w-5" />}
              hint={`${revenue.length} entries`}
              accent="sky"
            />
            <KpiCard
              label="Active Projects"
              value={`${activeProjects}`}
              icon={<Briefcase className="h-5 w-5" />}
              hint={`${projects.length} total`}
              accent="amber"
            />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="card">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    MRR Trend
                  </h3>
                  <p className="text-xs text-slate-500">
                    Monthly recurring revenue over the past year.
                  </p>
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={mrrSer}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="mrrFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => compactCurrency(v as number)}
                      width={50}
                    />
                    <Tooltip
                      formatter={(v: number) => currency(v)}
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid #e2e8f0",
                        fontSize: 12,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="mrr"
                      stroke="#4f46e5"
                      strokeWidth={2}
                      fill="url(#mrrFill)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card">
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-slate-900">
                  Monthly Revenue
                </h3>
                <p className="text-xs text-slate-500">
                  All recorded revenue per month.
                </p>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={revSeries}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => compactCurrency(v as number)}
                      width={50}
                    />
                    <Tooltip
                      formatter={(v: number) => currency(v)}
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid #e2e8f0",
                        fontSize: 12,
                      }}
                      cursor={{ fill: "#f8fafc" }}
                    />
                    <Bar
                      dataKey="revenue"
                      fill="#10b981"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="card lg:col-span-2">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">
                  Targets Progress
                </h3>
                <span className="text-xs text-slate-500">
                  {targets.length} target{targets.length === 1 ? "" : "s"}
                </span>
              </div>

              {targets.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-500">
                  No targets yet. Add some on the Targets page.
                </p>
              ) : (
                <div className="space-y-4">
                  {targets.map((t) => {
                    const { current, pct } = targetProgress(t, {
                      customers,
                      revenue,
                      projectsCount: activeProjects,
                    });
                    const value =
                      t.metric === "customers" || t.metric === "projects"
                        ? `${current} / ${t.targetValue}`
                        : `${currency(current)} / ${currency(t.targetValue)}`;
                    return (
                      <div key={t.id}>
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <span className="font-medium text-slate-800">
                            {t.name}
                          </span>
                          <span className="text-xs text-slate-500">
                            {value} · {pct}%
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-700 transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="card">
              <h3 className="mb-4 text-sm font-semibold text-slate-900">
                Quick stats
              </h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-600">
                    <Users className="h-4 w-4 text-slate-400" /> Customers
                  </span>
                  <span className="font-medium text-slate-900">
                    {customers.length}
                  </span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-600">
                    <Briefcase className="h-4 w-4 text-slate-400" /> Projects
                  </span>
                  <span className="font-medium text-slate-900">
                    {projects.length}
                  </span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-600">
                    <DollarSign className="h-4 w-4 text-slate-400" /> Revenue
                    entries
                  </span>
                  <span className="font-medium text-slate-900">
                    {revenue.length}
                  </span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-600">
                    <TrendingUp className="h-4 w-4 text-slate-400" /> Avg deal
                    size
                  </span>
                  <span className="font-medium text-slate-900">
                    {activeCustomers > 0
                      ? currency(mrr / activeCustomers)
                      : "—"}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </>
      )}
    </>
  );
}
