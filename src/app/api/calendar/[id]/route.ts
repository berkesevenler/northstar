import { NextRequest } from "next/server";
import { eventSchema } from "@/lib/schemas";
import { handleDelete, handleUpdate } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const body = await req.json();
  return handleUpdate(eventSchema, params.id, body);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  return handleDelete(eventSchema, params.id);
}
