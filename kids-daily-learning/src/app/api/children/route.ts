import type { NextRequest } from "next/server";
import { body, HttpError, json, requireParentMode, requireSession, route } from "@/server/http";
import { NewChildSchema } from "@/server/schemas";
import { db } from "@/server/db";
import { DEFAULT_SETTINGS, toChild } from "@/server/progressRepo";
import { LIMITS } from "@/core/validation";

export const GET = route(async () => {
  const s = await requireSession();
  const kids = await db.child.findMany({ where: { parentId: s.pid, ...(s.mode === "child" && s.cid ? { id: s.cid } : {}) }, include: { settings: true }, orderBy: { createdAt: "asc" } });
  return json(kids.map(toChild));
});

export const POST = route(async (req: NextRequest) => {
  const s = await requireParentMode();
  const input = await body(req, NewChildSchema);
  if ((await db.child.count({ where: { parentId: s.pid } })) >= LIMITS.maxChildren) throw new HttpError(400, `You can add up to ${LIMITS.maxChildren} children.`);
  const child = await db.child.create({
    data: {
      parentId: s.pid, name: input.name, age: input.age, avatar: input.avatar,
      settings: { create: { ...DEFAULT_SETTINGS, screenTimeMinutes: input.age < 8 ? 45 : 60 } },
      streak: { create: {} },
    },
    include: { settings: true },
  });
  return json(toChild(child), 201);
});
