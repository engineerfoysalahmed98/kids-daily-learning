"use client";
import { useEffect, useState, type ReactNode } from "react";
import { useApp } from "@/state/AppProvider";
import { Link, useNav } from "@/nav/nav";
import { Logo, LogoMark } from "../brand";
import { Spinner } from "../primitives";
import { ParentGate } from "../ParentGate";

const NAV = [
  { to: "/parent", icon: "📊", label: "Dashboard" },
  { to: "/parent/children", icon: "👧", label: "Children" },
  { to: "/parent/progress", icon: "📈", label: "Progress" },
  { to: "/parent/settings", icon: "⚙️", label: "Settings" },
];

/** Frame for parent screens. Blocks access while the device is in child mode. */
export function ParentShell({ children, title, actions }: { children: ReactNode; title: string; actions?: ReactNode }) {
  const { session, service, refreshSession } = useApp();
  const nav = useNav();
  const [gate, setGate] = useState(false);

  useEffect(() => {
    if (session && !session.parent) nav.go("/login", { replace: true });
  }, [session, nav]);

  if (!session || !session.parent) return <Spinner />;

  if (session.mode === "child") {
    return (
      <div className="grid min-h-dvh place-items-center bg-bg px-4">
        <div className="card grid max-w-sm place-items-center gap-4 p-8 text-center">
          <span className="text-5xl" aria-hidden="true">🔒</span>
          <h1 className="text-2xl">This area is for grown-ups</h1>
          <p className="text-muted">The device is in kid mode.</p>
          <div className="flex w-full gap-3">
            <button className="btn-secondary flex-1" onClick={() => nav.go("/home")}>Back to learning</button>
            <button className="btn-primary flex-1" onClick={() => setGate(true)}>I'm a grown-up</button>
          </div>
        </div>
        <ParentGate open={gate} onClose={() => setGate(false)} onPass={() => setGate(false)} />
      </div>
    );
  }

  const active = (to: string) => (to === "/parent" ? nav.path === "/parent" : nav.path.startsWith(to));
  const isAdmin = session.parent.role === "ADMIN";

  return (
    <div className="min-h-dvh bg-bg lg:grid lg:grid-cols-[240px_1fr]">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-surface focus:px-4 focus:py-2">Skip to content</a>
      <aside className="sticky top-0 hidden h-dvh flex-col gap-1.5 border-r-2 border-line bg-surface px-4 py-6 lg:flex">
        <Link to="/parent" className="mb-6"><Logo compact /></Link>
        <p className="label mb-1 px-3">Parent area</p>
        <nav aria-label="Parent" className="grid gap-1">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} aria-current={active(n.to) ? "page" : undefined}
              className={`flex min-h-[46px] items-center gap-3 rounded-xl px-3 font-bold ${active(n.to) ? "bg-math/15 text-ink" : "text-muted hover:bg-sunken"}`}>
              <span aria-hidden="true">{n.icon}</span>{n.label}
            </Link>
          ))}
          {isAdmin && (
            <Link to="/admin" className="flex min-h-[46px] items-center gap-3 rounded-xl px-3 font-bold text-muted hover:bg-sunken"><span aria-hidden="true">🛠️</span>Content admin</Link>
          )}
        </nav>
        <div className="mt-auto grid gap-2">
          <button className="btn-primary btn-sm" onClick={() => nav.go("/profiles")}>🧒 Switch to kid mode</button>
          <button className="btn-ghost btn-sm" onClick={async () => { await service.logOut(); await refreshSession(); nav.go("/"); }}>Log out</button>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-[env(safe-area-inset-top,0px)] z-30 border-b-2 border-line bg-bg/90 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
            <Link to="/parent" className="lg:hidden" aria-label="Parent dashboard"><LogoMark size={34} /></Link>
            <h1 className="text-xl sm:text-2xl">{title}</h1>
            <div className="ml-auto flex items-center gap-2">
              {actions}
              <button className="btn-primary btn-sm lg:hidden" onClick={() => nav.go("/profiles")} aria-label="Switch to kid mode">🧒 Kids</button>
            </div>
          </div>
        </header>
        <main id="main" className="mx-auto max-w-5xl px-4 pb-28 pt-5 lg:pb-12">{children}</main>
      </div>

      <nav aria-label="Parent" className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-line bg-surface pb-[env(safe-area-inset-bottom,0px)] lg:hidden">
        <ul className="mx-auto grid max-w-lg grid-cols-4">
          {NAV.map((n) => (
            <li key={n.to}>
              <Link to={n.to} aria-current={active(n.to) ? "page" : undefined} className="flex min-h-[60px] flex-col items-center justify-center gap-0.5 text-xs font-extrabold">
                <span className={`grid h-8 w-12 place-items-center rounded-full text-lg ${active(n.to) ? "bg-math/20" : ""}`} aria-hidden="true">{n.icon}</span>
                <span className={active(n.to) ? "text-ink" : "text-muted"}>{n.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
