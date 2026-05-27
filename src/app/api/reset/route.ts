import { NextResponse } from "next/server";
import { google } from "googleapis";
import {
  customerSchema,
  projectSchema,
  revenueSchema,
  targetSchema,
} from "@/lib/schemas";
import { errorResponse } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
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
