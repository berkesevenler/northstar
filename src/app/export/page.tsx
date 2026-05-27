"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import HydrationGate from "@/components/HydrationGate";
import { useTracker } from "@/lib/store";
import {
  calcARR,
  calcMRR,
  currency,
  revenueInRange,
  targetProgress,
  totalRevenue,
} from "@/lib/metrics";

export default function ExportPage() {
  return (
    <HydrationGate
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-slate-400">
          Loading data…
        </div>
      }
    >
      <ExportReport />
    </HydrationGate>
  );
}

function ExportReport() {
  const { projects, customers, revenue, targets } = useTracker();
  const printedRef = useRef(false);

  const mrr = calcMRR(customers);
  const arr = calcARR(customers);
  const total = totalRevenue(revenue);
  const activeCustomers = customers.filter((c) => c.status === "active");
  const leadCustomers = customers.filter((c) => c.status === "lead");
  const activeProjects = projects.filter((p) => p.status === "active");
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
  const thisMonth = revenueInRange(revenue, startOfMonth, endOfMonth);
  const thisYear = revenueInRange(revenue, startOfYear, endOfYear);

  const reportDate = now.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const sortedRevenue = [...revenue].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  useEffect(() => {
    if (!printedRef.current) {
      printedRef.current = true;
    }
  }, []);

  return (
    <>
      {/* Print / close toolbar — hidden when printing */}
      <div className="no-print fixed bottom-6 right-6 z-50 flex gap-2">
        <button
          onClick={() => window.close()}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-lg transition hover:bg-slate-50"
        >
          ← Close
        </button>
        <button
          onClick={() => window.print()}
          className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-brand-700"
        >
          Save as PDF / Print
        </button>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          @page { margin: 20mm 18mm; size: A4; }
        }
      `}</style>

      <div className="mx-auto max-w-4xl bg-white px-8 py-10 text-slate-900">

        {/* Header */}
        <div className="mb-10 flex items-center justify-between border-b border-slate-200 pb-8">
          <div className="flex items-center gap-4">
            <Image
              src="/logo.png"
              alt="Logo"
              width={52}
              height={52}
              className="h-13 w-13 object-contain"
            />
            <div>
              <div className="text-2xl font-bold tracking-tight text-slate-900">
                Business Overview
              </div>
              <div className="mt-0.5 text-sm text-slate-500">
                Prepared {reportDate}
              </div>
            </div>
          </div>
          <div className="text-right text-xs text-slate-400 uppercase tracking-widest">
            Confidential
          </div>
        </div>

        {/* KPI Grid */}
        <section className="mb-10">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-500">
            Key Metrics
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: "Monthly Recurring Revenue", value: currency(mrr), sub: "MRR" },
              { label: "Annual Recurring Revenue", value: currency(arr), sub: "ARR" },
              { label: "Revenue This Month", value: currency(thisMonth), sub: "Logged cash" },
              { label: "Revenue This Year", value: currency(thisYear), sub: "Logged cash" },
            ].map((k) => (
              <div
                key={k.label}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="text-xs text-slate-500">{k.sub}</div>
                <div className="mt-1 text-2xl font-bold text-slate-900">
                  {k.value}
                </div>
                <div className="mt-0.5 text-xs text-slate-500">{k.label}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: "Active Customers", value: String(activeCustomers.length), sub: "Paying" },
              { label: "Pipeline / Leads", value: String(leadCustomers.length), sub: "Leads" },
              { label: "Active Projects", value: String(activeProjects.length), sub: "In flight" },
              { label: "Total Revenue (all time)", value: currency(total), sub: "Cumulative" },
            ].map((k) => (
              <div
                key={k.label}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="text-xs text-slate-500">{k.sub}</div>
                <div className="mt-1 text-2xl font-bold text-slate-900">
                  {k.value}
                </div>
                <div className="mt-0.5 text-xs text-slate-500">{k.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Targets */}
        {targets.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-500">
              Targets &amp; Goals
            </h2>
            <div className="space-y-4">
              {targets.map((t) => {
                const { current, pct } = targetProgress(t, {
                  customers,
                  revenue,
                  projectsCount: activeProjects.length,
                });
                const isCount =
                  t.metric === "customers" || t.metric === "projects";
                const due = new Date(t.dueDate);
                const daysLeft = Math.ceil(
                  (due.getTime() - Date.now()) / 86400000,
                );
                return (
                  <div key={t.id} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-slate-900">{t.name}</div>
                        <div className="text-xs text-slate-500 capitalize">
                          {t.metric.toUpperCase()} · {t.period}
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        <div className="font-bold text-slate-900">{pct}%</div>
                        <div className="text-xs text-slate-500">
                          {daysLeft >= 0
                            ? `${daysLeft}d left`
                            : `${Math.abs(daysLeft)}d overdue`}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="mb-1 flex justify-between text-xs text-slate-500">
                        <span>{isCount ? current : currency(current)}</span>
                        <span>Target: {isCount ? t.targetValue : currency(t.targetValue)}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full ${pct >= 100 ? "bg-emerald-500" : "bg-brand-600"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Active Customers */}
        {activeCustomers.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-500">
              Active Customers ({activeCustomers.length})
            </h2>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="pb-2 pr-4">Customer</th>
                  <th className="pb-2 pr-4">Contact</th>
                  <th className="pb-2 pr-4">Billing</th>
                  <th className="pb-2 text-right">Monthly Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeCustomers
                  .sort((a, b) => b.monthlyValue - a.monthlyValue)
                  .map((c) => (
                    <tr key={c.id}>
                      <td className="py-2 pr-4 font-medium text-slate-900">{c.name}</td>
                      <td className="py-2 pr-4 text-slate-600">{c.contactName || "—"}</td>
                      <td className="py-2 pr-4 capitalize text-slate-600">
                        {c.billingCycle}
                      </td>
                      <td className="py-2 text-right font-semibold text-slate-900">
                        {currency(c.monthlyValue)}
                      </td>
                    </tr>
                  ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200">
                  <td colSpan={3} className="pt-2 text-xs font-semibold text-slate-500">
                    Total MRR
                  </td>
                  <td className="pt-2 text-right font-bold text-slate-900">
                    {currency(mrr)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </section>
        )}

        {/* Active Projects */}
        {activeProjects.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-500">
              Active Projects ({activeProjects.length})
            </h2>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="pb-2 pr-4">Project</th>
                  <th className="pb-2 pr-4">Customer</th>
                  <th className="pb-2 pr-4">Started</th>
                  <th className="pb-2 text-right">Budget</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeProjects.map((p) => {
                  const cust = customers.find((c) => c.id === p.customerId);
                  return (
                    <tr key={p.id}>
                      <td className="py-2 pr-4 font-medium text-slate-900">{p.name}</td>
                      <td className="py-2 pr-4 text-slate-600">{cust?.name || "—"}</td>
                      <td className="py-2 pr-4 text-slate-600">
                        {new Date(p.startDate).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-2 text-right font-semibold text-slate-900">
                        {p.budget ? currency(p.budget) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        )}

        {/* Recent Revenue */}
        {sortedRevenue.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-500">
              Recent Revenue (last 20 entries)
            </h2>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="pb-2 pr-4">Date</th>
                  <th className="pb-2 pr-4">Description</th>
                  <th className="pb-2 pr-4">Type</th>
                  <th className="pb-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedRevenue.slice(0, 20).map((r) => (
                  <tr key={r.id}>
                    <td className="py-2 pr-4 text-slate-600 whitespace-nowrap">
                      {new Date(r.date).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-2 pr-4 text-slate-900">{r.description}</td>
                    <td className="py-2 pr-4 capitalize text-slate-600">
                      {r.type.replace("-", " ")}
                    </td>
                    <td className="py-2 text-right font-semibold text-emerald-700">
                      +{currency(r.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {/* Footer */}
        <div className="border-t border-slate-200 pt-6 text-center text-xs text-slate-400">
          This report was generated on {reportDate} and contains confidential
          business information.
        </div>
      </div>
    </>
  );
}
