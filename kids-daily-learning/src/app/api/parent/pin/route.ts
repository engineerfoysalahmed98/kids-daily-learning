import type { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { body, HttpError, json, requireParentMode, requireSession, route } from "@/server/http";
import { PinSchema } from "@/server/schemas";
import { hit, LIMITS } from "@/server/rateLimit";
import { db } from "@/server/db";

export const PUT = route(async (req: NextRequest) => {
  const s = await requireParentMode();
  const { pin } = await body(req, PinSchema);
  const pinHash = pin ? await bcrypt.hash(pin, 12) : null;
  await db.parentSettings.upsert({ where: { parentId: s.pid }, create: { parentId: s.pid, pinHash }, update: { pinHash } });
  return json({ ok: true });
});

export const POST = route(async (req: NextRequest) => {
  const s = await requireSession();
  const { pin } = await body(req, z.object({ pin: z.string().regex(/^\d{4}$/) }));
  if (!hit(`pin:${s.pid}`, LIMITS.pin).ok) throw new HttpError(429, "Too many tries. Please wait 15 minutes.");
  const settings = await db.parentSettings.findUnique({ where: { parentId: s.pid } });
  return json({ ok: !!settings?.pinHash && (await bcrypt.compare(pin, settings.pinHash)) });
});
