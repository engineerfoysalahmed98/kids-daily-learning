import type { NextRequest } from "next/server";
import { body, clientIp, HttpError, json, route } from "@/server/http";
import { SignUpSchema } from "@/server/schemas";
import { hit, LIMITS } from "@/server/rateLimit";
import { db } from "@/server/db";
import { hashPassword, parentDto, setSessionCookie } from "@/server/auth";
import { assertSessionSecret } from "@/server/session";
import { Prisma } from "@prisma/client";

const EMAIL_TAKEN = "An account with this email already exists. Try logging in.";

export const POST = route(async (req: NextRequest) => {
  if (!hit(`signup:${clientIp(req)}`, LIMITS.signup).ok) throw new HttpError(429, "Too many sign-ups from this network. Please try again later.");
  const input = await body(req, SignUpSchema);
  // Fail before creating the account; otherwise a missing AUTH_SECRET leaves an orphan user and retries hit 409.
  assertSessionSecret();
  const exists = await db.user.findUnique({ where: { email: input.email }, select: { id: true } });
  if (exists) throw new HttpError(409, EMAIL_TAKEN, "email");
  const tz = req.headers.get("x-time-zone") ?? "UTC";
  const user = await db.user.create({
    data: {
      email: input.email, passwordHash: await hashPassword(input.password),
      parent: { create: { displayName: input.displayName, settings: { create: { timeZone: /^[\w/+-]{1,64}$/.test(tz) ? tz : "UTC" } } } },
    },
    include: { parent: true },
  }).catch((e: unknown) => {
    // Two sign-ups with the same email racing past the check above.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") throw new HttpError(409, EMAIL_TAKEN, "email");
    throw e;
  });
  await setSessionCookie({ sub: user.id, pid: user.parent!.id, role: user.role, mode: "parent", cid: null, sv: user.sessionVersion });
  return json(await parentDto(user.parent!.id), 201);
});
