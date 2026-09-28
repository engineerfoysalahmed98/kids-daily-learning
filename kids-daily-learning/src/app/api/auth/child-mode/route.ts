import type { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { body, HttpError, json, requireChild, requireSession, route } from "@/server/http";
import { ChildModeSchema, ExitChildModeSchema } from "@/server/schemas";
import { setSessionCookie } from "@/server/auth";
import { hit, LIMITS } from "@/server/rateLimit";
import { db } from "@/server/db";

/** Enter kid mode: the session is re-issued locked to one child. */
export const POST = route(async (req: NextRequest) => {
  const { childId } = await body(req, ChildModeSchema);
  const { session } = await requireChild(childId, { childSelfOk: true });
  await setSessionCookie({ ...session, mode: "child", cid: childId });
  return json({ ok: true });
});

/** Leave kid mode. Requires the parent PIN when one is set. */
export const DELETE = route(async (req: NextRequest) => {
  const s = await requireSession();
  const { pin } = await body(req, ExitChildModeSchema);
  const settings = await db.parentSettings.findUnique({ where: { parentId: s.pid } });
  if (settings?.pinHash) {
    if (!hit(`pin:${s.pid}`, LIMITS.pin).ok) throw new HttpError(429, "Too many tries. Please wait 15 minutes.");
    if (!pin || !(await bcrypt.compare(pin, settings.pinHash))) throw new HttpError(403, "That PIN isn't right.");
  }
  await setSessionCookie({ ...s, mode: "parent" });
  return json({ ok: true });
});
