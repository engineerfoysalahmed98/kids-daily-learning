import { json, requireParentMode, route } from "@/server/http";
import { db } from "@/server/db";

export const GET = route(async () => {
  const s = await requireParentMode();
  const rows = await db.notification.findMany({ where: { parentId: s.pid }, orderBy: { createdAt: "desc" }, take: 100 });
  return json(rows.map((n) => ({ ...n, createdAt: n.createdAt.toISOString() })));
});

export const PATCH = route(async () => {
  const s = await requireParentMode();
  await db.notification.updateMany({ where: { parentId: s.pid, read: false }, data: { read: true } });
  return json({ ok: true });
});
