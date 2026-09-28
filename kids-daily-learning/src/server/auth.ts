import "server-only";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import type { Parent } from "@/core/types";
import { db } from "./db";
import { cookieOptions, SESSION_COOKIE, signSession, type SessionClaims } from "./session";

export const hashPassword = (pw: string) => bcrypt.hash(pw, 12);
export const verifyPassword = (pw: string, hash: string) => bcrypt.compare(pw, hash);

/** Same work for unknown emails, so login timing doesn't reveal which accounts exist. */
let dummy: Promise<string> | null = null;
export async function verifyOrBurn(pw: string, hash: string | undefined) {
  if (!hash) {
    dummy ??= bcrypt.hash("kdl-dummy-password", 12);
    await bcrypt.compare(pw, await dummy);
    return false;
  }
  return bcrypt.compare(pw, hash);
}

export async function setSessionCookie(claims: SessionClaims) {
  (await cookies()).set(SESSION_COOKIE, await signSession(claims), cookieOptions);
}

export async function clearSessionCookie() {
  (await cookies()).set(SESSION_COOKIE, "", { ...cookieOptions, maxAge: 0 });
}

export async function parentDto(parentId: string): Promise<Parent> {
  const p = await db.parent.findUniqueOrThrow({ where: { id: parentId }, include: { user: true, settings: true } });
  return {
    id: p.id, email: p.user.email, displayName: p.displayName, createdAt: p.createdAt.toISOString(), role: p.user.role,
    hasPin: !!p.settings?.pinHash,
    notifications: { activity: p.settings?.notifyActivity ?? true, badge: p.settings?.notifyBadge ?? true, goal: p.settings?.notifyGoal ?? true },
  };
}
