import type { Customer, RevenueEntry, Target } from "./types";

export const currency = (n: number) =>
  new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n || 0);

export const compactCurrency = (n: number) =>
  new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n || 0);

export function calcMRR(customers: Customer[]): number {
  return customers
    .filter((c) => c.status === "active")
    .reduce((sum, c) => sum + (c.monthlyValue || 0), 0);
}

export function calcARR(customers: Customer[]): number {
  return calcMRR(customers) * 12;
}

export function totalRevenue(entries: RevenueEntry[]): number {
  return entries.reduce((s, r) => s + (r.amount || 0), 0);
}

export function revenueInRange(
  entries: RevenueEntry[],
  start: Date,
  end: Date,
): number {
  return entries
    .filter((r) => {
      const d = new Date(r.date);
      return d >= start && d <= end;
    })
    .reduce((s, r) => s + r.amount, 0);
}

export function monthlyRevenueSeries(
  entries: RevenueEntry[],
  months = 12,
): { month: string; revenue: number }[] {
  const today = new Date();
  const result: { month: string; revenue: number }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const next = new Date(today.getFullYear(), today.getMonth() - i + 1, 1);
    const total = entries
      .filter((r) => {
        const rd = new Date(r.date);
        return rd >= d && rd < next;
      })
      .reduce((s, r) => s + r.amount, 0);
    result.push({
      month: d.toLocaleDateString("en-US", {
        month: "short",
        year: "2-digit",
      }),
      revenue: total,
    });
  }
  return result;
}

export function mrrSeries(
  customers: Customer[],
  months = 12,
): { month: string; mrr: number }[] {
  const today = new Date();
  const out: { month: string; mrr: number }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const next = new Date(today.getFullYear(), today.getMonth() - i + 1, 1);
    const mrr = customers.reduce((sum, c) => {
      const started = new Date(c.startDate);
      const ended = c.endDate ? new Date(c.endDate) : null;
      const wasActive =
        started < next && (ended === null || ended >= d) && c.status !== "lead";
      return sum + (wasActive ? c.monthlyValue || 0 : 0);
    }, 0);
    out.push({
      month: d.toLocaleDateString("en-US", {
        month: "short",
        year: "2-digit",
      }),
      mrr,
    });
  }
  return out;
}

export function targetProgress(
  target: Target,
  ctx: {
    customers: Customer[];
    revenue: RevenueEntry[];
    projectsCount: number;
  },
): { current: number; pct: number } {
  let current = 0;
  switch (target.metric) {
    case "mrr":
      current = calcMRR(ctx.customers);
      break;
    case "arr":
      current = calcARR(ctx.customers);
      break;
    case "customers":
      current = ctx.customers.filter((c) => c.status === "active").length;
      break;
    case "projects":
      current = ctx.projectsCount;
      break;
    case "revenue":
      current = totalRevenue(ctx.revenue);
      break;
  }
  const pct = target.targetValue
    ? Math.min(100, Math.round((current / target.targetValue) * 100))
    : 0;
  return { current, pct };
}
