"use client";
import type { ReactNode } from "react";
import { Link } from "@/nav/nav";
import { useApp } from "@/state/AppProvider";
import { Logo } from "../brand";

export function PublicShell({ children }: { children: ReactNode }) {
  const { session } = useApp();
  const loggedIn = !!session?.parent;
  return (
    <div className="min-h-dvh bg-bg">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-surface focus:px-4 focus:py-2">Skip to content</a>
      <header className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-4">
        <Link to="/" aria-label="Kids Daily Learning home"><Logo /></Link>
        <nav aria-label="Site" className="ml-auto flex items-center gap-1 sm:gap-2">
          <Link to="/safety" className="hidden min-h-[44px] items-center rounded-xl px-3 font-bold text-muted hover:text-ink sm:inline-flex">Safety</Link>
          {loggedIn
            ? <Link to="/parent" className="btn-secondary btn-sm">Parent area</Link>
            : <Link to="/login" className="btn-ghost btn-sm">Log in</Link>}
          <Link to={session?.mode === "child" ? "/home" : loggedIn ? "/profiles" : "/signup"} className="btn-primary btn-sm">Start Learning</Link>
        </nav>
      </header>
      <main id="main">{children}</main>
      <footer className="mt-16 border-t-2 border-line">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:grid-cols-[1fr_auto]">
          <div className="grid gap-2">
            <Logo compact />
            <p className="max-w-sm text-sm text-muted">Short, joyful daily learning for ages 4–12. No ads, no in-app purchases, no chat with strangers.</p>
          </div>
          <nav aria-label="Footer" className="flex flex-wrap items-start gap-x-5 gap-y-2 text-sm font-bold text-muted">
            <Link to="/safety" className="hover:text-ink">Privacy & Safety</Link>
            <Link to="/login" className="hover:text-ink">Parent login</Link>
            <Link to="/signup" className="hover:text-ink">Create account</Link>
            <Link to="/admin" className="hover:text-ink">Content admin</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
