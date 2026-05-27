import { NextResponse } from "next/server";
import { google } from "googleapis";
import {
  customerSchema,
  projectSchema,
  revenueSchema,
  targetSchema,
} from "@/lib/schemas";
import { errorResponse } from "@/lib/api-helpers";
import type {
  Customer,
  Project,
  RevenueEntry,
  Target,
} from "@/lib/types";
import { appendItem, listAll } from "@/lib/sheets";

export const dynamic = "force-dynamic";

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

const now = () => new Date().toISOString();

const iso = (offsetDays = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
};

export async function POST() {
  try {
    // First clear all data tabs (keep headers).
    const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!;
    const privateKey = (process.env.GOOGLE_PRIVATE_KEY ?? "").replace(
      /\\n/g,
      "\n",
    );
    const spreadsheetId = process.env.GOOGLE_SHEET_ID!;
    const auth = new google.auth.JWT({
      email,
      key: privateKey,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    const sheets = google.sheets({ version: "v4", auth });

    // Make sure all tabs exist (listAll will auto-create them).
    await Promise.all([
      listAll(projectSchema),
      listAll(customerSchema),
      listAll(revenueSchema),
      listAll(targetSchema),
    ]);

    await sheets.spreadsheets.values.batchClear({
      spreadsheetId,
      requestBody: {
        ranges: [
          `${projectSchema.name}!A2:Z`,
          `${customerSchema.name}!A2:Z`,
          `${revenueSchema.name}!A2:Z`,
          `${targetSchema.name}!A2:Z`,
        ],
      },
    });

    const customers: Customer[] = [
      {
        id: uid(),
        name: "Acme Corp",
        contactName: "Jane Smith",
        email: "jane@acme.com",
        status: "active",
        billingCycle: "monthly",
        monthlyValue: 2500,
        startDate: iso(-180),
        notes: "Enterprise plan",
        createdAt: now(),
      },
      {
        id: uid(),
        name: "Nimbus AI",
        contactName: "Tom Lee",
        email: "tom@nimbus.ai",
        status: "active",
        billingCycle: "yearly",
        monthlyValue: 1500,
        startDate: iso(-90),
        createdAt: now(),
      },
      {
        id: uid(),
        name: "Bright Studio",
        contactName: "Sara Park",
        email: "sara@bright.studio",
        status: "lead",
        billingCycle: "monthly",
        monthlyValue: 800,
        startDate: iso(-10),
        createdAt: now(),
      },
    ];

    const projects: Project[] = [
      {
        id: uid(),
        name: "Acme Internal Tools v2",
        description: "Rebuild Acme's internal ops dashboard.",
        status: "active",
        customerId: customers[0].id,
        startDate: iso(-60),
        budget: 45000,
        createdAt: now(),
      },
      {
        id: uid(),
        name: "Nimbus Model Pipeline",
        description: "ML inference pipeline integration.",
        status: "active",
        customerId: customers[1].id,
        startDate: iso(-30),
        budget: 28000,
        createdAt: now(),
      },
      {
        id: uid(),
        name: "Marketing Site Refresh",
        description: "Internal marketing site refresh.",
        status: "planning",
        startDate: iso(7),
        budget: 6000,
        createdAt: now(),
      },
    ];

    const revenue: RevenueEntry[] = [
      {
        id: uid(),
        customerId: customers[0].id,
        description: "Acme - monthly subscription",
        type: "subscription",
        amount: 2500,
        date: iso(-30),
        createdAt: now(),
      },
      {
        id: uid(),
        customerId: customers[0].id,
        description: "Acme - monthly subscription",
        type: "subscription",
        amount: 2500,
        date: iso(0),
        createdAt: now(),
      },
      {
        id: uid(),
        customerId: customers[1].id,
        description: "Nimbus - annual plan",
        type: "subscription",
        amount: 18000,
        date: iso(-60),
        createdAt: now(),
      },
      {
        id: uid(),
        description: "Consulting workshop",
        type: "service",
        amount: 4000,
        date: iso(-15),
        createdAt: now(),
      },
    ];

    const targets: Target[] = [
      {
        id: uid(),
        name: "Reach €10k MRR",
        metric: "mrr",
        period: "monthly",
        targetValue: 10000,
        dueDate: iso(90),
        createdAt: now(),
      },
      {
        id: uid(),
        name: "10 active customers",
        metric: "customers",
        period: "quarterly",
        targetValue: 10,
        dueDate: iso(120),
        createdAt: now(),
      },
      {
        id: uid(),
        name: "€150k ARR",
        metric: "arr",
        period: "yearly",
        targetValue: 150000,
        dueDate: iso(365),
        createdAt: now(),
      },
    ];

    for (const c of customers) await appendItem(customerSchema, c);
    for (const p of projects) await appendItem(projectSchema, p);
    for (const r of revenue) await appendItem(revenueSchema, r);
    for (const t of targets) await appendItem(targetSchema, t);

    return NextResponse.json({
      ok: true,
      counts: {
        customers: customers.length,
        projects: projects.length,
        revenue: revenue.length,
        targets: targets.length,
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
