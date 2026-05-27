import { NextRequest } from "next/server";
import { revenueSchema } from "@/lib/schemas";
import { handleDelete, handleUpdate } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const body = await req.json();
  return handleUpdate(revenueSchema, params.id, body);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  return handleDelete(revenueSchema, params.id);
}
