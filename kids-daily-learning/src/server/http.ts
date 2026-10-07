import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { ZodError, type ZodSchema } from "zod";
import { cookies } from "next/headers";
import { Prisma } from "@prisma/client";
import { db } from "./db";
import { SESSION_COOKIE, verifySession, type SessionClaims } from "./session";

export class HttpError extends Error {
  constructor(public status: number, message: string, public field?: string) { super(message); }
}

export const json = <T,>(data: T, status = 200) => NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });

/** Wraps a route handler: consistent JSON errors, no stack traces to clients. */
export function route<C = unknown>(handler: (req: NextRequest, ctx: C) => Promise<Response>) {
  return async (req: NextRequest, ctx: C): Promise<Response> => {
    try {
      return await handler(req, ctx);
    } catch (e) {
      if (e instanceof HttpError) return json({ error: e.message, field: e.field }, e.status);
      if (e instanceof ZodError) {
        const issue = e.issues[0];
        return json({ error: issue?.message ?? "Invalid input.", field: issue?.path.join(".") }, 400);
      }
      console.error("[api]", req.method, req.nextUrl.pathname, e);
      if (isDatabaseUnavailable(e)) {
        return json({ error: "We can't reach our database right now, so accounts and saved progress are unavailable. Please try again in a few minutes." }, 503);
      }
      return json({ error: "Something went wrong on our side. Please try again." }, 500);
    }
  };
}

/**
 * Connection/setup failures (unreachable server, timeouts, missing DATABASE_URL,
 * tables not migrated) as opposed to bugs. The full error is still logged above.
 */
const DB_UNAVAILABLE_CODES = new Set(["P1000", "P1001", "P1002", "P1008", "P1017", "P2021", "P2024"]);
function isDatabaseUnavailable(e: unknown): boolean {
  if (e instanceof Prisma.PrismaClientInitializationError) return true;
  return e instanceof Prisma.PrismaClientKnownRequestError && DB_UNAVAILABLE_CODES.has(e.code);
}

export async function body<T>(req: NextRequest, schema: ZodSchema<T>): Promise<T> {
  let raw: unknown;
  try { raw = await req.json(); } catch { throw new HttpError(400, "Request body must be JSON."); }
  return schema.parse(raw);
}

export function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}

// ---------------------------------------------------------------- authorization

export async function getSession(): Promise<SessionClaims | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const s = await verifySession(token);
  if (!s) return null;
  // Revocation check: token must match the user's current session version.
  const user = await db.user.findUnique({ where: { id: s.sub }, select: { sessionVersion: true, role: true } });
  if (!user || user.sessionVersion !== s.sv) return null;
  return { ...s, role: user.role };
}

export async function requireSession(): Promise<SessionClaims> {
  const s = await getSession();
  if (!s) throw new HttpError(401, "Please log in to continue.");
  return s;
}

/** Parent-only actions: blocked while the device is in child mode. */
export async function requireParentMode(): Promise<SessionClaims> {
  const s = await requireSession();
  if (s.mode === "child") throw new HttpError(403, "Ask a grown-up to unlock the parent area.");
  return s;
}

export async function requireAdmin(): Promise<SessionClaims> {
  const s = await requireParentMode();
  if (s.role !== "ADMIN") throw new HttpError(403, "Only content admins can do that.");
  return s;
}

/**
 * The core IDOR guard: a child is only reachable by its own parent, and in
 * child mode only the active child is reachable.
 */
export async function requireChild(childId: string, opts: { childSelfOk: boolean }) {
  const s = await requireSession();
  const child = await db.child.findFirst({ where: { id: childId, parentId: s.pid }, include: { settings: true } });
  if (!child) throw new HttpError(404, "Profile not found.");
  if (s.mode === "child" && (!opts.childSelfOk || s.cid !== childId)) throw new HttpError(403, "This belongs to another profile.");
  return { session: s, child };
}
