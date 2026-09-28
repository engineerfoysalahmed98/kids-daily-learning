"use client";
import { createContext, useContext, type AnchorHTMLAttributes, type ComponentType, type ReactNode } from "react";

/**
 * Tiny navigation abstraction so every screen works both inside Next.js
 * (src/nav/NextNav.tsx) and inside the single-file playable demo
 * (demo/HashNav.tsx).
 */
export interface Nav {
  path: string;
  params: Record<string, string>;
  go(to: string, opts?: { replace?: boolean }): void;
  back(fallback?: string): void;
  Link: ComponentType<LinkProps>;
}

export interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  to: string;
  children: ReactNode;
}

const NavContext = createContext<Nav | null>(null);

export function NavProvider({ nav, children }: { nav: Nav; children: ReactNode }) {
  return <NavContext.Provider value={nav}>{children}</NavContext.Provider>;
}

export function useNav(): Nav {
  const nav = useContext(NavContext);
  if (!nav) throw new Error("useNav must be used inside <NavProvider>");
  return nav;
}

export function Link(props: LinkProps) {
  const { Link: Impl } = useNav();
  return <Impl {...props} />;
}

/** Route patterns shared by the Next app and the demo router. */
export const ROUTES = {
  landing: "/",
  signup: "/signup",
  login: "/login",
  safety: "/safety",
  profiles: "/profiles",
  home: "/home",
  learn: "/learn",
  subject: "/learn/:subject",
  lesson: "/lesson/:id",
  quiz: "/quiz/:id",
  read: "/read/:id",
  create: "/create/:id",
  habit: "/habit/:id",
  memory: "/memory/:id",
  complete: "/complete/:id",
  games: "/games",
  stories: "/stories",
  rewards: "/rewards",
  badges: "/badges",
  me: "/me",
  buddy: "/buddy",
  parent: "/parent",
  parentChildren: "/parent/children",
  parentProgress: "/parent/progress",
  parentSettings: "/parent/settings",
  admin: "/admin",
} as const;

export function matchRoute(pattern: string, path: string): Record<string, string> | null {
  const p = pattern.split("/").filter(Boolean);
  const a = path.split("?")[0].split("/").filter(Boolean);
  if (p.length !== a.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < p.length; i++) {
    if (p[i].startsWith(":")) {
      try { params[p[i].slice(1)] = decodeURIComponent(a[i]); } catch { return null; }
    } else if (p[i] !== a[i]) return null;
  }
  return params;
}
