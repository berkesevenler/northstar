import { NextResponse } from "next/server";
import {
  customerSchema,
  projectSchema,
  revenueSchema,
  targetSchema,
} from "@/lib/schemas";
import { errorResponse } from "@/lib/api-helpers";
import { getSheets } from "@/lib/sheets";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const { sheets, spreadsheetId } = await getSheets();

    const tabs = [
      projectSchema.name,
      customerSchema.name,
      revenueSchema.name,
      targetSchema.name,
    ];

    await sheets.spreadsheets.values.batchClear({
      spreadsheetId,
      requestBody: {
        ranges: tabs.map((t) => `${t}!A2:Z`),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
