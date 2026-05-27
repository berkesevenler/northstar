"use client";

import { useMemo, useState } from "react";
import { Users, Plus, Pencil, Trash2, Mail } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Modal from "@/components/Modal";
import EmptyState from "@/components/EmptyState";
import HydrationGate from "@/components/HydrationGate";
import { useTracker } from "@/lib/store";
import { calcARR, calcMRR, currency } from "@/lib/metrics";
import type { BillingCycle, Customer, CustomerStatus } from "@/lib/types";
import KpiCard from "@/components/KpiCard";
import clsx from "clsx";

const STATUS_LABEL: Record<CustomerStatus, string> = {
  lead: "Lead",
  active: "Active",
  churned: "Churned",
};

const STATUS_COLOR: Record<CustomerStatus, string> = {
  lead: "bg-sky-50 text-sky-700",
  active: "bg-emerald-50 text-emerald-700",
  churned: "bg-rose-50 text-rose-700",
};

interface FormState {
  id?: string;
  name: string;
  contactName: string;
  email: string;
  status: CustomerStatus;
  billingCycle: BillingCycle;
  monthlyValue: string;
  startDate: string;
  endDate: string;
  notes: string;
}

const empty: FormState = {
  name: "",
  contactName: "",
  email: "",
  status: "active",
  billingCycle: "monthly",
  monthlyValue: "",
  startDate: new Date().toISOString().slice(0, 10),
  endDate: "",
  notes: "",
};

export default function CustomersPage() {
  return (
    <HydrationGate
      fallback={<div className="text-sm text-slate-400">Loading…</div>}
    >
      <Customers />
    </HydrationGate>
  );
}

function Customers() {
  const { customers, addCustomer, updateCustomer, deleteCustomer, saving } =
    useTracker();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(empty);
  const [statusFilter, setStatusFilter] = useState<"all" | CustomerStatus>(
    "all",
  );

  const filtered = useMemo(() => {
    return [...customers]
      .filter((c) => (statusFilter === "all" ? true : c.status === statusFilter))
      .sort((a, b) => b.monthlyValue - a.monthlyValue);
  }, [customers, statusFilter]);

  const mrr = calcMRR(customers);
  const arr = calcARR(customers);
  const activeCount = customers.filter((c) => c.status === "active").length;

  function openNew() {
    setForm(empty);
    setModalOpen(true);
  }

  function openEdit(c: Customer) {
    setForm({
      id: c.id,
      name: c.name,
      contactName: c.contactName || "",
      email: c.email || "",
      status: c.status,
      billingCycle: c.billingCycle,
      monthlyValue: c.monthlyValue.toString(),
      startDate: c.startDate,
      endDate: c.endDate || "",
      notes: c.notes || "",
    });
    setModalOpen(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    const payload = {
      name: form.name.trim(),
      contactName: form.contactName.trim() || undefined,
      email: form.email.trim() || undefined,
      status: form.status,
      billingCycle: form.billingCycle,
      monthlyValue: Number(form.monthlyValue) || 0,
      startDate: form.startDate,
      endDate: form.endDate || undefined,
      notes: form.notes.trim() || undefined,
    };
    try {
      if (form.id) {
        await updateCustomer(form.id, payload);
      } else {
        await addCustomer(payload);
      }
      setModalOpen(false);
    } catch {
      /* error banner handles it */
    }
  }

  return (
    <>
      <PageHeader
        title="Customers"
        subtitle="Active accounts and pipeline."
        actions={
          <button onClick={openNew} className="btn-primary">
            <Plus className="h-4 w-4" /> New customer
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard
          label="Active customers"
          value={`${activeCount}`}
          accent="emerald"
          hint={`${customers.length} total`}
        />
        <KpiCard label="MRR" value={currency(mrr)} accent="indigo" />
        <KpiCard label="ARR" value={currency(arr)} accent="sky" />
      </div>

      <div className="mb-4 mt-6 flex flex-wrap gap-2">
        {(["all", "active", "lead", "churned"] as const).map((s) => (
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
            {s === "all" ? "All" : STATUS_LABEL[s as CustomerStatus]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Users className="h-5 w-5" />}
          title="No customers yet"
          description="Add your customers and track their value to MRR/ARR automatically."
          action={
            <button onClick={openNew} className="btn-primary">
              <Plus className="h-4 w-4" /> Add your first customer
            </button>
          }
        />
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Customer</th>
                  <th className="px-4 py-3 text-left font-medium">Contact</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Billing</th>
                  <th className="px-4 py-3 text-right font-medium">
                    Monthly value
                  </th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">
                        {c.name}
                      </div>
                      <div className="mt-0.5 text-xs text-slate-500">
                        Since {new Date(c.startDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {c.contactName || "—"}
                      {c.email && (
                        <a
                          href={`mailto:${c.email}`}
                          className="mt-0.5 flex items-center gap-1 text-xs text-brand-600 hover:underline"
                        >
                          <Mail className="h-3 w-3" /> {c.email}
                        </a>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={clsx("badge", STATUS_COLOR[c.status])}>
                        {STATUS_LABEL[c.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 capitalize">
                      {c.billingCycle.replace("-", " ")}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-900">
                      {currency(c.monthlyValue)}
                      <div className="text-xs font-normal text-slate-500">
                        / month
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => openEdit(c)}
                          className="rounded-md p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                          aria-label="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete "${c.name}"?`)) {
                              deleteCustomer(c.id);
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={form.id ? "Edit customer" : "New customer"}
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
              form="customer-form"
              type="submit"
              className="btn-primary"
              disabled={saving}
            >
              {saving ? "Saving…" : form.id ? "Save changes" : "Add customer"}
            </button>
          </>
        }
      >
        <form id="customer-form" onSubmit={submit} className="space-y-3">
          <div>
            <label className="label">Company / Customer name</label>
            <input
              autoFocus
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Acme Corp"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Contact name</label>
              <input
                className="input"
                value={form.contactName}
                onChange={(e) =>
                  setForm({ ...form, contactName: e.target.value })
                }
                placeholder="Jane Smith"
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="jane@acme.com"
              />
            </div>
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
                    status: e.target.value as CustomerStatus,
                  })
                }
              >
                <option value="lead">Lead</option>
                <option value="active">Active</option>
                <option value="churned">Churned</option>
              </select>
            </div>
            <div>
              <label className="label">Billing</label>
              <select
                className="input"
                value={form.billingCycle}
                onChange={(e) =>
                  setForm({
                    ...form,
                    billingCycle: e.target.value as BillingCycle,
                  })
                }
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="one-time">One-time</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Monthly value (EUR)</label>
            <input
              type="number"
              min={0}
              step="50"
              className="input"
              value={form.monthlyValue}
              onChange={(e) =>
                setForm({ ...form, monthlyValue: e.target.value })
              }
              placeholder="0"
            />
            <p className="mt-1 text-xs text-slate-500">
              Used to calculate MRR/ARR. For yearly plans, enter the equivalent
              monthly value.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Customer since</label>
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
              <label className="label">Churn date (optional)</label>
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
            <label className="label">Notes</label>
            <textarea
              className="input"
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Anything important about this customer…"
            />
          </div>
        </form>
      </Modal>
    </>
  );
}
