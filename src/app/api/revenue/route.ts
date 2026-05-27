import { NextRequest } from "next/server";
import { revenueSchema } from "@/lib/schemas";
import { handleCreate, handleList } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET() {
  return handleList(revenueSchema);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  return handleCreate(revenueSchema, body);
}
