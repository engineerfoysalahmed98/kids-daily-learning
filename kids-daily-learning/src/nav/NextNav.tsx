"use client";
import NextLink from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useMemo, type ReactNode } from "react";
import { NavProvider, type LinkProps, type Nav } from "./nav";

function NextLinkAdapter({ to, children, ...rest }: LinkProps) {
  return <NextLink href={to} {...rest}>{children}</NextLink>;
}

/** Next.js App Router implementation of the Nav interface. */
export function NextNavProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const raw = useParams() ?? {};
  const params = useMemo(() => {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(raw)) out[k] = decodeURIComponent(Array.isArray(v) ? v.join("/") : String(v));
    return out;
  }, [raw]);

  const nav: Nav = useMemo(() => ({
    path: pathname,
    params,
    go: (to, opts) => (opts?.replace ? router.replace(to) : router.push(to)),
    back: (fallback = "/home") => (typeof window !== "undefined" && window.history.length > 1 ? router.back() : router.push(fallback)),
    Link: NextLinkAdapter,
  }), [pathname, params, router]);

  return <NavProvider nav={nav}>{children}</NavProvider>;
}
