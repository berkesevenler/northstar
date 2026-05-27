import "server-only";
import type {
  Customer,
  Project,
  ProjectStatus,
  CustomerStatus,
  BillingCycle,
  RevenueEntry,
  RevenueType,
  Target,
  TargetMetric,
  TargetPeriod,
} from "./types";
import type { TableSchema } from "./sheets";

const num = (v: string): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const optStr = (v: string): string | undefined => {
  const t = (v ?? "").trim();
  return t === "" ? undefined : t;
};

export const projectSchema: TableSchema<Project> = {
  name: "projects",
  columns: [
    "id",
    "name",
    "description",
    "status",
    "customerId",
    "startDate",
    "endDate",
    "budget",
    "createdAt",
  ],
  toRow: (p) => [
    p.id,
    p.name,
    p.description ?? "",
    p.status,
    p.customerId ?? "",
    p.startDate,
    p.endDate ?? "",
    String(p.budget ?? 0),
    p.createdAt,
  ],
  fromRow: (r) => ({
    id: r[0],
    name: r[1],
    description: r[2] ?? "",
    status: (r[3] || "planning") as ProjectStatus,
    customerId: optStr(r[4]),
    startDate: r[5],
    endDate: optStr(r[6]),
    budget: num(r[7]),
    createdAt: r[8] || new Date().toISOString(),
  }),
};

export const customerSchema: TableSchema<Customer> = {
  name: "customers",
  columns: [
    "id",
    "name",
    "contactName",
    "email",
    "status",
    "billingCycle",
    "monthlyValue",
    "startDate",
    "endDate",
    "notes",
    "createdAt",
  ],
  toRow: (c) => [
    c.id,
    c.name,
    c.contactName ?? "",
    c.email ?? "",
    c.status,
    c.billingCycle,
    String(c.monthlyValue ?? 0),
    c.startDate,
    c.endDate ?? "",
    c.notes ?? "",
    c.createdAt,
  ],
  fromRow: (r) => ({
    id: r[0],
    name: r[1],
    contactName: optStr(r[2]),
    email: optStr(r[3]),
    status: (r[4] || "active") as CustomerStatus,
    billingCycle: (r[5] || "monthly") as BillingCycle,
    monthlyValue: num(r[6]),
    startDate: r[7],
    endDate: optStr(r[8]),
    notes: optStr(r[9]),
    createdAt: r[10] || new Date().toISOString(),
  }),
};

export const revenueSchema: TableSchema<RevenueEntry> = {
  name: "revenue",
  columns: [
    "id",
    "customerId",
    "projectId",
    "description",
    "type",
    "amount",
    "date",
    "createdAt",
  ],
  toRow: (e) => [
    e.id,
    e.customerId ?? "",
    e.projectId ?? "",
    e.description,
    e.type,
    String(e.amount ?? 0),
    e.date,
    e.createdAt,
  ],
  fromRow: (r) => ({
    id: r[0],
    customerId: optStr(r[1]),
    projectId: optStr(r[2]),
    description: r[3],
    type: (r[4] || "other") as RevenueType,
    amount: num(r[5]),
    date: r[6],
    createdAt: r[7] || new Date().toISOString(),
  }),
};

export const targetSchema: TableSchema<Target> = {
  name: "targets",
  columns: [
    "id",
    "name",
    "metric",
    "period",
    "targetValue",
    "dueDate",
    "notes",
    "createdAt",
  ],
  toRow: (t) => [
    t.id,
    t.name,
    t.metric,
    t.period,
    String(t.targetValue ?? 0),
    t.dueDate,
    t.notes ?? "",
    t.createdAt,
  ],
  fromRow: (r) => ({
    id: r[0],
    name: r[1],
    metric: (r[2] || "mrr") as TargetMetric,
    period: (r[3] || "monthly") as TargetPeriod,
    targetValue: num(r[4]),
    dueDate: r[5],
    notes: optStr(r[6]),
    createdAt: r[7] || new Date().toISOString(),
  }),
};
