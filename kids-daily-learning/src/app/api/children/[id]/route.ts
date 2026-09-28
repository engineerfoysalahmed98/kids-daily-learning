import type { NextRequest } from "next/server";
import { body, json, requireChild, route } from "@/server/http";
import { ChildPatchSchema } from "@/server/schemas";
import { db } from "@/server/db";
import { toChild } from "@/server/progressRepo";

type Ctx = { params: Promise<{ id: string }> };

export const GET = route<Ctx>(async (_req, { params }) => {
  const { child } = await requireChild((await params).id, { childSelfOk: true });
  return json(toChild(child));
});

export const PATCH = route<Ctx>(async (req: NextRequest, { params }) => {
  const { child } = await requireChild((await params).id, { childSelfOk: false });
  const patch = await body(req, ChildPatchSchema);
  const updated = await db.child.update({
    where: { id: child.id },
    data: {
      name: patch.name, age: patch.age, avatar: patch.avatar,
      settings: patch.settings ? { upsert: { create: { ...patch.settings }, update: { ...patch.settings } } } : undefined,
    },
    include: { settings: true },
  });
  return json(toChild(updated));
});

/** Deleting a child cascades to every learning record (see schema onDelete: Cascade). */
export const DELETE = route<Ctx>(async (_req, { params }) => {
  const { child } = await requireChild((await params).id, { childSelfOk: false });
  await db.child.delete({ where: { id: child.id } });
  return new Response(null, { status: 204 });
});
