import { describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

// Minimal stand-ins so the real middleware logic runs without a Next server.
vi.mock("next/server", () => {
  class FakeResponse {
    status: number;
    location?: string;
    headers = new Headers();
    constructor(status: number, location?: string) { this.status = status; this.location = location; }
  }
  return {
    NextResponse: {
      next: () => new FakeResponse(200),
      redirect: (url: URL) => new FakeResponse(307, url.pathname),
      json: (_body: unknown, init?: { status?: number }) => new FakeResponse(init?.status ?? 200),
    },
  };
});
// Logged out: no valid session cookie.
vi.mock("@/server/session", () => ({ SESSION_COOKIE: "kdl_session", verifySession: async () => null }));

const { middleware } = await import("../src/middleware");

/** A logged-out GET request for `pathname`. */
function guestGet(pathname: string): NextRequest {
  const url = new URL(`https://kids.example${pathname}`);
  const req = {
    method: "GET",
    headers: new Headers(),
    cookies: { get: () => undefined },
    nextUrl: Object.assign(url, { clone: () => new URL(url.href) }),
  };
  return req as unknown as NextRequest;
}

async function statusFor(pathname: string): Promise<{ status: number; location?: string }> {
  const res = (await middleware(guestGet(pathname))) as unknown as { status: number; location?: string };
  return { status: res.status, location: res.location };
}

describe("guest access (no login, no email)", () => {
  const LEARNING = [
    "/shikhi", "/shikhi/progress",
    "/shikhi/bangla", "/shikhi/bangla/shoroborno", "/shikhi/bangla/byanjonborno", "/shikhi/bangla/lekha",
    "/shikhi/english", "/shikhi/english/abc", "/shikhi/english/phonics",
    "/shikhi/math", "/shikhi/math/puzzles", "/bangla-math", "/bangla-math/quiz/add-1",
    "/shikhi/poems", "/shikhi/poems/gram", "/shikhi/stories", "/shikhi/stories/trishnarto-kak",
    "/shikhi/quiz/bn-chena", "/learn", "/home",
  ];

  it.each(LEARNING)("%s is open to guests", async (path) => {
    expect(await statusFor(path)).toEqual({ status: 200, location: undefined });
  });

  it("parent and admin pages still need a login", async () => {
    expect(await statusFor("/parent")).toEqual({ status: 307, location: "/login" });
    expect(await statusFor("/admin")).toEqual({ status: 307, location: "/login" });
  });

  it("look-alike paths are not opened by the /shikhi prefix", async () => {
    expect(await statusFor("/shikhi-admin")).toEqual({ status: 307, location: "/login" });
  });

  it("private APIs still reject guests", async () => {
    expect((await statusFor("/api/children")).status).toBe(401);
  });
});
