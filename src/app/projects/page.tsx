"use client";

import { useMemo, useState } from "react";
import { Briefcase, Plus, Pencil, Trash2 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Modal from "@/components/Modal";
import EmptyState from "@/components/EmptyState";
import HydrationGate from "@/components/HydrationGate";
import { useTracker } from "@/lib/store";
import { currency } from "@/lib/metrics";
import type { Project, ProjectStatus } from "@/lib/types";
import clsx from "clsx";

const STATUS_LABEL: Record<ProjectStatus, string> = {
  planning: "Planning",
  active: "Active",
  "on-hold": "On hold",
  completed: "Completed",
};

const STATUS_COLOR: Record<ProjectStatus, string> = {
  planning: "bg-sky-50 text-sky-700",
  active: "bg-emerald-50 text-emerald-700",
  "on-hold": "bg-amber-50 text-amber-700",
  completed: "bg-slate-100 text-slate-700",
};

interface FormState {
  id?: string;
  name: string;
  description: string;
  status: ProjectStatus;
  customerId: string;
  startDate: string;
  endDate: string;
  budget: string;
}

const empty: FormState = {
  name: "",
  description: "",
  status: "planning",
  customerId: "",
  startDate: new Date().toISOString().slice(0, 10),
  endDate: "",
  budget: "",
};

export default function ProjectsPage() {
  return (
    <HydrationGate
      fallback={<div className="text-sm text-slate-400">Loading…</div>}
    >
      <Projects />
    </HydrationGate>
  );
}

function Projects() {
  const {
    projects,
    customers,
    addProject,
    updateProject,
    deleteProject,
    saving,
  } = useTracker();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(empty);
  const [statusFilter, setStatusFilter] = useState<"all" | ProjectStatus>(
    "all",
  );

  const filtered = useMemo(() => {
    return [...projects]
      .filter((p) => (statusFilter === "all" ? true : p.status === statusFilter))
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }, [projects, statusFilter]);

  function openNew() {
    setForm(empty);
    setModalOpen(true);
  }

  function openEdit(p: Project) {
    setForm({
      id: p.id,
      name: p.name,
      description: p.description,
      status: p.status,
      customerId: p.customerId || "",
      startDate: p.startDate,
      endDate: p.endDate || "",
      budget: p.budget.toString(),
    });
    setModalOpen(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      status: form.status,
      customerId: form.customerId || undefined,
      startDate: form.startDate,
      endDate: form.endDate || undefined,
      budget: Number(form.budget) || 0,
    };
    try {
      if (form.id) {
        await updateProject(form.id, payload);
      } else {
        await addProject(payload);
      }
      setModalOpen(false);
    } catch {
      // Error is shown via the global error banner; keep modal open.
    }
  }

  return (
    <>
      <PageHeader
        title="Projects"
        subtitle="Everything your team is building."
        actions={
          <button onClick={openNew} className="btn-primary">
            <Plus className="h-4 w-4" /> New project
          </button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {(["all", "active", "planning", "on-hold", "completed"] as const).map(
          (s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={clsx(
                "rounded-full px-3 py-1 text-xs font-medium transition",
                statusFilter === s
                  ? "bg-brand-600 text-white"
                  : "bg-white text-slate-600 hover:bg-slate-100",
              )}
            >
              {s === "all" ? "All" : STATUS_LABEL[s as ProjectStatus]}
            </button>
          ),
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Briefcase className="h-5 w-5" />}
          title="No projects here yet"
          description="Track every project so you can see what your team is shipping."
          action={
            <button onClick={openNew} className="btn-primary">
              <Plus className="h-4 w-4" /> Add your first project
            </button>
          }
        />
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Project</th>
                  <th className="px-4 py-3 text-left font-medium">Customer</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Start</th>
                  <th className="px-4 py-3 text-right font-medium">Budget</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filtered.map((p) => {
                  const customer = customers.find((c) => c.id === p.customerId);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">
                          {p.name}
                        </div>
                        {p.description && (
                          <div className="mt-0.5 line-clamp-1 text-xs text-slate-500">
                            {p.description}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {customer?.name || (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={clsx("badge", STATUS_COLOR[p.status])}
                        >
                          {STATUS_LABEL[p.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {new Date(p.startDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-slate-900">
                        {currency(p.budget)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => openEdit(p)}
                            className="rounded-md p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                            aria-label="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete "${p.name}"?`)) {
                                deleteProject(p.id);
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

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={form.id ? "Edit project" : "New project"}
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
              form="project-form"
              type="submit"
              className="btn-primary"
              disabled={saving}
            >
              {saving ? "Saving…" : form.id ? "Save changes" : "Add project"}
            </button>
          </>
        }
      >
        <form id="project-form" onSubmit={submit} className="space-y-3">
          <div>
            <label className="label">Name</label>
            <input
              autoFocus
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Acme Internal Tools v2"
              required
            />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              className="input"
              rows={2}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="What's this project about?"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Status</label>
              <select
                className="input"
                value={form.status}
                onChange={(e) =>
                  setForm({
                    ...form,
                    status: e.target.value as ProjectStatus,
                  })
                }
              >
                <option value="planning">Planning</option>
                <option value="active">Active</option>
                <option value="on-hold">On hold</option>
                <option value="completed">Completed</option>
              </select>
            </div>
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
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Start date</label>
              <input
                type="date"
                className="input"
                value={form.startDate}
                onChange={(e) =>
                  setForm({ ...form, startDate: e.target.value })
                }
                required
              />
            </div>
            <div>
              <label className="label">End date (optional)</label>
              <input
                type="date"
                className="input"
                value={form.endDate}
                onChange={(e) =>
                  setForm({ ...form, endDate: e.target.value })
                }
              />
            </div>
          </div>
          <div>
            <label className="label">Budget (EUR)</label>
            <input
              type="number"
              min={0}
              step="100"
              className="input"
              value={form.budget}
              onChange={(e) => setForm({ ...form, budget: e.target.value })}
              placeholder="0"
            />
          </div>
        </form>
      </Modal>
    </>
  );
}
