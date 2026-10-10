import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/server/session";

/**
 * Edge middleware — first line of defence (route handlers re-check everything):
 *  1. CSRF: mutating /api requests must come from our own origin.
 *  2. Pages: learning is open to everyone (logged-out visitors learn as an
 *     on-device guest); other pages need a login; kid mode can't open parent/admin pages.
 *  3. Security headers on every response.
 * Anything not listed as public needs a session (deny by default).
 */
const PUBLIC_PAGES = ["/", "/login", "/signup", "/safety"];
/**
 * Learning sections open to everyone — no account, no email. These pages use
 * only built-in content and save guest progress on the device (localStorage);
 * they call no private API, so every /api route keeps its existing protection.
 */
const PUBLIC_PREFIXES = ["/bangla-math"];
/** Child learning pages (and their sub-pages, e.g. /learn/math, /quiz/<id>). */
const LEARNING_PAGES = ["/home", "/learn", "/lesson", "/quiz", "/read", "/stories", "/games", "/memory", "/create", "/habit", "/complete", "/rewards", "/badges", "/me", "/buddy"];
const PUBLIC_API = ["/api/auth/login", "/api/auth/signup", "/api/auth/session", "/api/auth/logout"];
/** Read-only curriculum (no personal data). Admin edits go through /api/admin/content, which stays protected. */
const PUBLIC_READ_API = ["/api/content"];
const PARENT_ONLY = ["/parent", "/admin"];

const under = (pathname: string, p: string) => pathname === p || pathname.startsWith(`${p}/`);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isApi = pathname.startsWith("/api/");

  if (isApi && !["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    const origin = req.headers.get("origin");
    if (!origin || new URL(origin).host !== req.nextUrl.host) {
      return withSecurityHeaders(NextResponse.json({ error: "Cross-site request blocked." }, { status: 403 }));
    }
  }

  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);

  if (isApi) {
    const publicRead = req.method === "GET" && PUBLIC_READ_API.some((p) => under(pathname, p));
    if (!session && !publicRead && !PUBLIC_API.some((p) => under(pathname, p))) {
      return withSecurityHeaders(NextResponse.json({ error: "Please log in to continue." }, { status: 401 }));
    }
  } else if (!isPublicPage(pathname)) {
    if (!session) {
      if (LEARNING_PAGES.some((p) => under(pathname, p))) return withSecurityHeaders(NextResponse.next());
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.search = "";
      return withSecurityHeaders(NextResponse.redirect(url));
    }
    if (session.mode === "child" && PARENT_ONLY.some((p) => under(pathname, p))) {
      // The ParentShell shows the grown-up gate; the page itself renders no parent data.
      const res = NextResponse.next();
      res.headers.set("x-kdl-child-mode", "1");
      return withSecurityHeaders(res);
    }
  }
  return withSecurityHeaders(NextResponse.next());
}

function isPublicPage(pathname: string) {
  return PUBLIC_PAGES.includes(pathname)
    || PUBLIC_PREFIXES.some((p) => under(pathname, p))
    || LEARNING_PAGES.some((p) => under(pathname, p));
}

function withSecurityHeaders(res: NextResponse) {
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg).*)"],
};
