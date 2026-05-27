import { NextRequest } from "next/server";
import { targetSchema } from "@/lib/schemas";
import { handleDelete, handleUpdate } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const body = await req.json();
  return handleUpdate(targetSchema, params.id, body);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  return handleDelete(targetSchema, params.id);
}
