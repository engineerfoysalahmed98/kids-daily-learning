import type { NextRequest } from "next/server";
import { body, json, requireParentMode, route } from "@/server/http";
import { ParentPatchSchema } from "@/server/schemas";
import { db } from "@/server/db";
import { parentDto } from "@/server/auth";

export const PATCH = route(async (req: NextRequest) => {
  const s = await requireParentMode();
  const patch = await body(req, ParentPatchSchema);
  if (patch.displayName) await db.parent.update({ where: { id: s.pid }, data: { displayName: patch.displayName } });
  if (patch.notifications) {
    const n = patch.notifications;
    const data = { notifyActivity: n.activity, notifyBadge: n.badge, notifyGoal: n.goal };
    await db.parentSettings.upsert({ where: { parentId: s.pid }, create: { parentId: s.pid, ...data }, update: data });
  }
  return json(await parentDto(s.pid));
});
