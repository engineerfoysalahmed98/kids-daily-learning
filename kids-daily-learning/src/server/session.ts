/**
 * Session tokens — shared by middleware (Edge runtime) and route handlers.
 * Signed JWT (HS256, jose) in an httpOnly, Secure, SameSite=Lax cookie.
 * Contains ids and roles only — never child names or other personal data.
 */
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "kdl_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 14; // 14 days

export interface SessionClaims {
  sub: string; // user id
  pid: string; // parent id
  role: "PARENT" | "ADMIN";
  /** "parent" = full access; "child" = locked to one child (cid) */
  mode: "parent" | "child";
  cid: string | null;
  sv: number; // session version (revocation)
}

function secret(): Uint8Array {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) throw new Error("AUTH_SECRET must be set to at least 32 random characters.");
  return new TextEncoder().encode(s);
}

export async function signSession(c: SessionClaims): Promise<string> {
  return new SignJWT({ pid: c.pid, role: c.role, mode: c.mode, cid: c.cid, sv: c.sv })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(c.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .setIssuer("kids-daily-learning")
    .sign(secret());
}

export async function verifySession(token: string | undefined): Promise<SessionClaims | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { issuer: "kids-daily-learning", algorithms: ["HS256"] });
    if (typeof payload.sub !== "string" || typeof payload.pid !== "string") return null;
    return {
      sub: payload.sub, pid: payload.pid as string,
      role: payload.role === "ADMIN" ? "ADMIN" : "PARENT",
      mode: payload.mode === "child" ? "child" : "parent",
      cid: typeof payload.cid === "string" ? payload.cid : null,
      sv: Number(payload.sv ?? 0),
    };
  } catch {
    return null;
  }
}

export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_TTL_SECONDS,
};
