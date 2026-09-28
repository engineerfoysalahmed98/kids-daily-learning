import type { NextRequest } from "next/server";
import { body, clientIp, HttpError, json, route } from "@/server/http";
import { LogInSchema } from "@/server/schemas";
import { hit, LIMITS } from "@/server/rateLimit";
import { db } from "@/server/db";
import { parentDto, setSessionCookie, verifyOrBurn } from "@/server/auth";

export const POST = route(async (req: NextRequest) => {
  const input = await body(req, LogInSchema);
  if (!hit(`login:${clientIp(req)}:${input.email}`, LIMITS.login).ok) throw new HttpError(429, "Too many attempts. Please wait a few minutes and try again.");
  const user = await db.user.findUnique({ where: { email: input.email }, include: { parent: true } });
  const ok = await verifyOrBurn(input.password, user?.passwordHash);
  if (!ok || !user?.parent) throw new HttpError(401, "That email and password don't match. Try again.");
  await setSessionCookie({ sub: user.id, pid: user.parent.id, role: user.role, mode: "parent", cid: null, sv: user.sessionVersion });
  return json(await parentDto(user.parent.id));
});
