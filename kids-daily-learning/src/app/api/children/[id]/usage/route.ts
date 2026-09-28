import type { NextRequest } from "next/server";
import { body, HttpError, json, requireChild, route } from "@/server/http";
import { UsageSchema } from "@/server/schemas";
import { db } from "@/server/db";
import { dayKey } from "@/core/engine";

type Ctx = { params: Promise<{ id: string }> };

/** Screen-time heartbeat (+seconds). Negative values = parent grants extra time. */
export const POST = route<Ctx>(async (req: NextRequest, { params }) => {
  const { child, session } = await requireChild((await params).id, { childSelfOk: true });
  const { seconds } = await body(req, UsageSchema);
  if (seconds < 0 && session.mode === "child") throw new HttpError(403, "Only a grown-up can add more time.");
  const tz = (await db.parentSettings.findUnique({ where: { parentId: session.pid }, select: { timeZone: true } }))?.timeZone ?? "UTC";
  const day = dayKey(new Date(), tz);
  const row = await db.dailyUsage.upsert({
    where: { childId_day: { childId: child.id, day } },
    create: { childId: child.id, day, seconds: Math.max(0, seconds) },
    update: { seconds: { increment: seconds } },
  });
  if (row.seconds < 0) await db.dailyUsage.update({ where: { id: row.id }, data: { seconds: 0 } });
  return json({ ok: true });
});
