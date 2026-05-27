import { NextResponse } from "next/server";
import { listAll } from "@/lib/sheets";
import {
  customerSchema,
  projectSchema,
  revenueSchema,
  targetSchema,
} from "@/lib/schemas";
import { errorResponse } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [projects, customers, revenue, targets] = await Promise.all([
      listAll(projectSchema),
      listAll(customerSchema),
      listAll(revenueSchema),
      listAll(targetSchema),
    ]);
    return NextResponse.json({ projects, customers, revenue, targets });
  } catch (err) {
    return errorResponse(err);
  }
}
