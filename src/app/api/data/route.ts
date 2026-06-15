import { NextResponse } from "next/server";
import { listAll } from "@/lib/sheets";
import {
  customerSchema,
  eventSchema,
  projectSchema,
  revenueSchema,
  targetSchema,
} from "@/lib/schemas";
import { errorResponse } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [projects, customers, revenue, targets, events] = await Promise.all([
      listAll(projectSchema),
      listAll(customerSchema),
      listAll(revenueSchema),
      listAll(targetSchema),
      listAll(eventSchema),
    ]);
    return NextResponse.json({ projects, customers, revenue, targets, events });
  } catch (err) {
    return errorResponse(err);
  }
}
