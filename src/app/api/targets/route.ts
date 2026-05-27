import { NextRequest } from "next/server";
import { targetSchema } from "@/lib/schemas";
import { handleCreate, handleList } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET() {
  return handleList(targetSchema);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  return handleCreate(targetSchema, body);
}
