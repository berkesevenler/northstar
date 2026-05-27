"use client";

import { useState } from "react";
import { Target as TargetIcon, Plus, Pencil, Trash2 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Modal from "@/components/Modal";
import EmptyState from "@/components/EmptyState";
import HydrationGate from "@/components/HydrationGate";
import { useTracker } from "@/lib/store";
import { currency, targetProgress } from "@/lib/metrics";
import type { Target, TargetMetric, TargetPeriod } from "@/lib/types";
import clsx from "clsx";

const METRIC_LABEL: Record<TargetMetric, string> = {
  mrr: "MRR",
  arr: "ARR",
  customers: "Active customers",
  projects: "Active projects",
  revenue: "Total revenue",
};

const METRIC_HINT: Record<TargetMetric, string> = {
  mrr: "Monthly recurring revenue from active customers",
  arr: "Annual recurring revenue (MRR × 12)",
  customers: "Count of customers in 'active' status",
  projects: "Count of projects in 'active' status",
  revenue: "Sum of all logged revenue entries",
};

interface FormState {
  id?: string;
  name: string;
  metric: TargetMetric;
  period: TargetPeriod;
  targetValue: string;
  dueDate: string;
  notes: string;
}

const empty: FormState = {
  name: "",
  metric: "mrr",
  period: "monthly",
  targetValue: "",
  dueDate: new Date(new Date().setMonth(new Date().getMonth() + 3))
    .toISOString()
    .slice(0, 10),
  notes: "",
};

export default function TargetsPage() {
  return (
    <HydrationGate
      fallback={<div className="text-sm text-slate-400">Loading…</div>}
    >
      <Targets />
    </HydrationGate>
  );
}

function Targets() {
  const {
    targets,
    customers,
    revenue,
    projects,
    addTarget,
    updateTarget,
    deleteTarget,
    saving,
  } = useTracker();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(empty);

  const activeProjects = projects.filter((p) => p.status === "active").length;

  function openNew() {
    setForm(empty);
    setModalOpen(true);
  }

  function openEdit(t: Target) {
    setForm({
      id: t.id,
      name: t.name,
      metric: t.metric,
      period: t.period,
      targetValue: t.targetValue.toString(),
      dueDate: t.dueDate,
      notes: t.notes || "",
    });
    setModalOpen(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    const payload = {
      name: form.name.trim(),
      metric: form.metric,
      period: form.period,
      targetValue: Number(form.targetValue) || 0,
      dueDate: form.dueDate,
      notes: form.notes.trim() || undefined,
    };
    try {
      if (form.id) {
        await updateTarget(form.id, payload);
      } else {
        await addTarget(payload);
      }
      setModalOpen(false);
    } catch {
      /* error banner handles it */
    }
  }

  return (
    <>
      <PageHeader
        title="Targets"
        subtitle="Set goals and watch them light up as you grow."
        actions={
          <button onClick={openNew} className="btn-primary">
            <Plus className="h-4 w-4" /> New target
          </button>
        }
      />

      {targets.length === 0 ? (
        <EmptyState
          icon={<TargetIcon className="h-5 w-5" />}
          title="No targets yet"
          description="Set ambitious numbers — MRR, ARR, customer counts — and track progress automatically."
          action={
            <button onClick={openNew} className="btn-primary">
              <Plus className="h-4 w-4" /> Add your first target
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {targets.map((t) => {
            const { current, pct } = targetProgress(t, {
              customers,
              revenue,
              projectsCount: activeProjects,
            });
            const isCountMetric =
              t.metric === "customers" || t.metric === "projects";
            const due = new Date(t.dueDate);
            const daysLeft = Math.ceil(
              (due.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
            );
            return (
              <div key={t.id} className="card">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      {METRIC_LABEL[t.metric]} · {t.period}
                    </div>
                    <h3 className="mt-1 text-lg font-semibold text-slate-900">
                      {t.name}
                    </h3>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEdit(t)}
                      className="rounded-md p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                      aria-label="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${t.name}"?`)) {
                          deleteTarget(t.id);
                        }
                      }}
                      className="rounded-md p-1.5 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex items-baseline justify-between text-sm">
                  <span className="text-slate-600">
                    {isCountMetric ? current : currency(current)}
                  </span>
                  <span className="text-slate-500">
                    of {isCountMetric ? t.targetValue : currency(t.targetValue)}
                  </span>
                </div>
                <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={clsx(
                      "h-full rounded-full bg-gradient-to-r transition-all",
                      pct >= 100
                        ? "from-emerald-500 to-emerald-700"
                        : "from-brand-500 to-brand-700",
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                  <span className="font-medium">{pct}% complete</span>
                  <span>
                    {daysLeft >= 0
                      ? `${daysLeft} day${daysLeft === 1 ? "" : "s"} left`
                      : `${Math.abs(daysLeft)} day${
                          Math.abs(daysLeft) === 1 ? "" : "s"
                        } overdue`}
                  </span>
                </div>

                {t.notes && (
                  <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
                    {t.notes}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={form.id ? "Edit target" : "New target"}
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
              form="target-form"
              type="submit"
              className="btn-primary"
              disabled={saving}
            >
              {saving ? "Saving…" : form.id ? "Save changes" : "Add target"}
            </button>
          </>
        }
      >
        <form id="target-form" onSubmit={submit} className="space-y-3">
          <div>
            <label className="label">Name</label>
            <input
              autoFocus
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Reach €10k MRR"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Metric</label>
              <select
                className="input"
                value={form.metric}
                onChange={(e) =>
                  setForm({
                    ...form,
                    metric: e.target.value as TargetMetric,
                  })
                }
              >
                <option value="mrr">MRR</option>
                <option value="arr">ARR</option>
                <option value="customers">Active customers</option>
                <option value="projects">Active projects</option>
                <option value="revenue">Total revenue</option>
              </select>
              <p className="mt-1 text-xs text-slate-500">
                {METRIC_HINT[form.metric]}
              </p>
            </div>
            <div>
              <label className="label">Period</label>
              <select
                className="input"
                value={form.period}
                onChange={(e) =>
                  setForm({
                    ...form,
                    period: e.target.value as TargetPeriod,
                  })
                }
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Target value</label>
              <input
                type="number"
                min={0}
                step={
                  form.metric === "customers" || form.metric === "projects"
                    ? "1"
                    : "100"
                }
                className="input"
                value={form.targetValue}
                onChange={(e) =>
                  setForm({ ...form, targetValue: e.target.value })
                }
                placeholder="0"
                required
              />
            </div>
            <div>
              <label className="label">Due date</label>
              <input
                type="date"
                className="input"
                value={form.dueDate}
                onChange={(e) =>
                  setForm({ ...form, dueDate: e.target.value })
                }
                required
              />
            </div>
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea
              className="input"
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Why this target? What's the plan?"
            />
          </div>
        </form>
      </Modal>
    </>
  );
}
