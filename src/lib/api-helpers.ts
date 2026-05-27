import "server-only";
import { NextResponse } from "next/server";
import {
  appendItem,
  deleteItem,
  findItem,
  listAll,
  updateItem,
  type TableSchema,
} from "./sheets";

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

export function errorResponse(err: unknown, status = 500) {
  const message =
    err instanceof Error ? err.message : "Unexpected server error.";
  console.error("[api] error:", err);
  return NextResponse.json({ error: message }, { status });
}

export async function handleList<T extends { id: string }>(
  schema: TableSchema<T>,
) {
  try {
    const items = await listAll(schema);
    return NextResponse.json({ items });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function handleCreate<T extends { id: string; createdAt: string }>(
  schema: TableSchema<T>,
  body: Omit<T, "id" | "createdAt">,
) {
  try {
    const item = {
      ...body,
      id: uid(),
      createdAt: new Date().toISOString(),
    } as T;
    await appendItem(schema, item);
    return NextResponse.json({ item }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function handleUpdate<T extends { id: string }>(
  schema: TableSchema<T>,
  id: string,
  patch: Partial<T>,
) {
  try {
    const existing = await findItem(schema, id);
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const next = { ...existing, ...patch, id: existing.id } as T;
    await updateItem(schema, next);
    return NextResponse.json({ item: next });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function handleDelete<T extends { id: string }>(
  schema: TableSchema<T>,
  id: string,
) {
  try {
    await deleteItem(schema, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
