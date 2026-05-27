"use client";

import { useMemo, useState } from "react";
import { DollarSign, Plus, Pencil, Trash2 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Modal from "@/components/Modal";
import EmptyState from "@/components/EmptyState";
import HydrationGate from "@/components/HydrationGate";
import KpiCard from "@/components/KpiCard";
import { useTracker } from "@/lib/store";
import {
  compactCurrency,
  currency,
  monthlyRevenueSeries,
  revenueInRange,
  totalRevenue,
} from "@/lib/metrics";
import type { RevenueEntry, RevenueType } from "@/lib/types";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import clsx from "clsx";

const TYPE_LABEL: Record<RevenueType, string> = {
  subscription: "Subscription",
  "one-time": "One-time",
  service: "Service",
  other: "Other",
};

const TYPE_COLOR: Record<RevenueType, string> = {
  subscription: "bg-indigo-50 text-indigo-700",
  "one-time": "bg-sky-50 text-sky-700",
  service: "bg-emerald-50 text-emerald-700",
  other: "bg-slate-100 text-slate-700",
};

interface FormState {
  id?: string;
  description: string;
  type: RevenueType;
  amount: string;
  date: string;
  customerId: string;
  projectId: string;
}

const empty: FormState = {
  description: "",
  type: "subscription",
  amount: "",
  date: new Date().toISOString().slice(0, 10),
  customerId: "",
  projectId: "",
};

export default function RevenuePage() {
  return (
    <HydrationGate
      fallback={<div className="text-sm text-slate-400">Loading…</div>}
    >
      <Revenue />
    </HydrationGate>
  );
}

function Revenue() {
  const {
    revenue,
    customers,
    projects,
    addRevenue,
    updateRevenue,
    deleteRevenue,
    saving,
  } = useTracker();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(empty);

  const sorted = useMemo(() => {
    return [...revenue].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [revenue]);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59);

  const total = totalRevenue(revenue);
  const thisMonth = revenueInRange(revenue, startOfMonth, endOfMonth);
  const thisYear = revenueInRange(revenue, startOfYear, endOfYear);

  const series = monthlyRevenueSeries(revenue, 12);

  function openNew() {
    setForm(empty);
    setModalOpen(true);
  }

  function openEdit(r: RevenueEntry) {
    setForm({
      id: r.id,
      description: r.description,
      type: r.type,
      amount: r.amount.toString(),
      date: r.date,
      customerId: r.customerId || "",
      projectId: r.projectId || "",
    });
    setModalOpen(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.description.trim()) return;
    const payload = {
      description: form.description.trim(),
      type: form.type,
      amount: Number(form.amount) || 0,
      date: form.date,
      customerId: form.customerId || undefined,
      projectId: form.projectId || undefined,
    };
    try {
      if (form.id) {
        await updateRevenue(form.id, payload);
      } else {
        await addRevenue(payload);
      }
      setModalOpen(false);
    } catch {
      /* error banner handles it */
    }
  }

  return (
    <>
      <PageHeader
        title="Revenue"
        subtitle="Your actual cash ledger — log every payment when it arrives."
        actions={
          <button onClick={openNew} className="btn-primary">
            <Plus className="h-4 w-4" /> Log revenue
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label="This month" value={currency(thisMonth)} accent="indigo" />
        <KpiCard label="This year" value={currency(thisYear)} accent="emerald" />
        <KpiCard label="All time" value={currency(total)} accent="sky" />
      </div>

      <div className="card mt-6">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-slate-900">
            Monthly revenue (last 12 months)
          </h3>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={series}
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
              <Bar dataKey="revenue" fill="#4f46e5" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-6">
        {sorted.length === 0 ? (
          <EmptyState
            icon={<DollarSign className="h-5 w-5" />}
            title="No revenue logged yet"
            description="Log every euro coming in — subscriptions, deals, consulting."
            action={
              <button onClick={openNew} className="btn-primary">
                <Plus className="h-4 w-4" /> Log first entry
              </button>
            }
          />
        ) : (
          <div className="card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Date</th>
                    <th className="px-4 py-3 text-left font-medium">
                      Description
                    </th>
                    <th className="px-4 py-3 text-left font-medium">Type</th>
                    <th className="px-4 py-3 text-left font-medium">Linked</th>
                    <th className="px-4 py-3 text-right font-medium">Amount</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {sorted.map((r) => {
                    const customer = customers.find(
                      (c) => c.id === r.customerId,
                    );
                    const project = projects.find((p) => p.id === r.projectId);
                    return (
                      <tr key={r.id} className="hover:bg-slate-50">
                        <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                          {new Date(r.date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {r.description}
                        </td>
                        <td className="px-4 py-3">
                          <span className={clsx("badge", TYPE_COLOR[r.type])}>
                            {TYPE_LABEL[r.type]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          <div className="flex flex-col gap-0.5 text-xs">
                            {customer && (
                              <span>Customer: {customer.name}</span>
                            )}
                            {project && <span>Project: {project.name}</span>}
                            {!customer && !project && (
                              <span className="text-slate-400">—</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-emerald-600">
                          +{currency(r.amount)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => openEdit(r)}
                              className="rounded-md p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                              aria-label="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm("Delete this revenue entry?")) {
                                  deleteRevenue(r.id);
                                }
                              }}
                              className="rounded-md p-1.5 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                              aria-label="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={form.id ? "Edit revenue" : "Log revenue"}
        footer={
          <>
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="btn-secondary"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              form="revenue-form"
              type="submit"
              className="btn-primary"
              disabled={saving}
            >
              {saving ? "Saving…" : form.id ? "Save changes" : "Add entry"}
            </button>
          </>
        }
      >
        <form id="revenue-form" onSubmit={submit} className="space-y-3">
          <div>
            <label className="label">Description</label>
            <input
              autoFocus
              className="input"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="e.g. Acme monthly subscription"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Amount (EUR)</label>
              <input
                type="number"
                min={0}
                step="0.01"
                className="input"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <label className="label">Date</label>
              <input
                type="date"
                className="input"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
              />
            </div>
          </div>
          <div>
            <label className="label">Type</label>
            <select
              className="input"
              value={form.type}
              onChange={(e) =>
                setForm({ ...form, type: e.target.value as RevenueType })
              }
            >
              <option value="subscription">Subscription (recurring monthly payment)</option>
              <option value="one-time">One-time (single payment)</option>
              <option value="service">Service / Consulting</option>
              <option value="other">Other</option>
            </select>
            <p className="mt-1 text-xs text-slate-500">
              This is a label only — log one entry per payment received. MRR/ARR
              are calculated from your active customers, not from these entries.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Customer (optional)</label>
              <select
                className="input"
                value={form.customerId}
                onChange={(e) =>
                  setForm({ ...form, customerId: e.target.value })
                }
              >
                <option value="">— None —</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Project (optional)</label>
              <select
                className="input"
                value={form.projectId}
                onChange={(e) =>
                  setForm({ ...form, projectId: e.target.value })
                }
              >
                <option value="">— None —</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </form>
      </Modal>
    </>
  );
}
