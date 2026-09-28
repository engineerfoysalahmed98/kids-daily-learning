"use client";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useApp } from "@/state/AppProvider";
import { useChildData } from "@/state/useChild";
import { Link, useNav } from "@/nav/nav";
import { LogoMark, BuddyBot } from "../brand";
import { Spinner, ErrorState } from "../primitives";
import { ParentGate } from "../ParentGate";
import { dayKey } from "@/core/engine";

const NAV = [
  { to: "/home", icon: "🏠", label: "Home" },
  { to: "/learn", icon: "📚", label: "Learn" },
  { to: "/games", icon: "🎮", label: "Games" },
  { to: "/stories", icon: "📖", label: "Stories" },
  { to: "/rewards", icon: "🏆", label: "Rewards" },
  { to: "/me", icon: "👤", label: "Profile" },
];

interface ChildPrefs { soundOn: boolean; aiEnabled: boolean; }
const PrefsContext = createContext<ChildPrefs>({ soundOn: true, aiEnabled: true });
export const useChildPrefs = () => useContext(PrefsContext);

function isActive(path: string, to: string) {
  if (to === "/home") return path === "/home";
  if (to === "/learn") return path.startsWith("/learn") || path.startsWith("/lesson") || path.startsWith("/quiz");
  if (to === "/rewards") return path.startsWith("/rewards") || path.startsWith("/badges");
  if (to === "/stories") return path.startsWith("/stories") || path.startsWith("/read");
  if (to === "/games") return path.startsWith("/games") || path.startsWith("/memory");
  return path.startsWith(to);
}

/** Frame for every child screen: guard, header, bottom nav (mobile) / rail (desktop), screen-time limit. */
export function ChildShell({ children, focus = false }: { children: ReactNode; focus?: boolean }) {
  const { session, service } = useApp();
  const nav = useNav();
  const data = useChildData();
  const [gate, setGate] = useState(false);
  const child = data.progress?.child;

  // Guard: need a logged-in parent and a selected child.
  useEffect(() => {
    if (!session) return;
    if (!session.parent) nav.go("/login", { replace: true });
    else if (!session.activeChildId) nav.go("/profiles", { replace: true });
  }, [session, nav]);

  // Apply child accessibility settings to the document.
  useEffect(() => {
    if (!child) return;
    document.documentElement.classList.toggle("large-text", child.settings.largeText);
    return () => document.documentElement.classList.remove("large-text");
  }, [child]);

  // Screen-time tracking (counts only while the page is visible).
  const [usedToday, setUsedToday] = useState(0);
  const lastTick = useRef(Date.now());
  useEffect(() => {
    if (!data.progress) return;
    setUsedToday(data.progress.usage[dayKey()] ?? 0);
  }, [data.progress]);
  useEffect(() => {
    if (!data.childId) return;
    const id = data.childId;
    lastTick.current = Date.now();
    const t = setInterval(() => {
      const now = Date.now();
      const secs = Math.min(60, Math.round((now - lastTick.current) / 1000));
      lastTick.current = now;
      if (document.visibilityState !== "visible" || secs <= 0) return;
      setUsedToday((u) => u + secs);
      void service.addUsage(id, secs).catch(() => undefined);
    }, 15000);
    return () => clearInterval(t);
  }, [data.childId, service]);

  if (!session || (data.loading && !data.progress)) return <div className="min-h-dvh bg-bg"><Spinner label="Getting your adventure ready" /></div>;
  if (data.error && !data.progress) return <div className="mx-auto max-w-md px-4 py-10"><ErrorState error={data.error} onRetry={data.reload} /></div>;
  if (!child || !data.summary) return <Spinner />;

  const limit = child.settings.screenTimeMinutes;
  const timeUp = limit > 0 && usedToday >= limit * 60;

  return (
    <PrefsContext.Provider value={{ soundOn: child.settings.soundOn, aiEnabled: child.settings.aiEnabled }}>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-surface focus:px-4 focus:py-2">Skip to content</a>
      <div className="min-h-dvh bg-bg lg:grid lg:grid-cols-[220px_1fr]">
        {/* Desktop rail */}
        <aside className="sticky top-0 hidden h-dvh flex-col gap-2 border-r-2 border-line bg-surface px-4 py-6 lg:flex">
          <Link to="/home" className="mb-6 flex items-center gap-2 font-display text-lg font-semibold"><LogoMark size={36} /> Kids Daily</Link>
          <nav aria-label="Main" className="grid gap-1.5">
            {NAV.map((n) => {
              const active = isActive(nav.path, n.to);
              return (
                <Link key={n.to} to={n.to} aria-current={active ? "page" : undefined}
                  className={`flex min-h-[48px] items-center gap-3 rounded-2xl px-3 font-display text-lg ${active ? "bg-sun/30 font-semibold" : "text-muted hover:bg-sunken"}`}>
                  <span className="text-2xl" aria-hidden="true">{n.icon}</span>{n.label}
                </Link>
              );
            })}
          </nav>
          {child.settings.aiEnabled && (
            <Link to="/buddy" className="mt-4 flex items-center gap-3 rounded-2xl bg-gk/15 p-3 font-display font-semibold">
              <BuddyBot size={40} /> Ask Buddy
            </Link>
          )}
          <button className="mt-auto text-left text-sm font-bold text-muted underline-offset-4 hover:underline" onClick={() => setGate(true)}>🔒 Grown-ups</button>
        </aside>

        <div className="min-w-0">
          {!focus && (
            <header className="sticky top-[env(safe-area-inset-top,0px)] z-30 border-b-2 border-line bg-bg/90 backdrop-blur">
              <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-2.5">
                <Link to="/me" className="flex items-center gap-2 rounded-2xl pr-2" aria-label={`${child.name}'s profile`}>
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-sun/30 text-2xl" aria-hidden="true">{child.avatar}</span>
                  <span className="font-display text-lg font-semibold">{child.name}</span>
                </Link>
                <div className="ml-auto flex items-center gap-2">
                  <span className="chip bg-sun/25" aria-label={`${data.summary.xp} XP`}><span aria-hidden="true">⚡</span><span className="tnum">{data.summary.xp}</span></span>
                  <span className="chip bg-flame/15" aria-label={`${data.summary.streak.current} day streak`}><span aria-hidden="true">🔥</span><span className="tnum">{data.summary.streak.current}</span></span>
                  {child.settings.aiEnabled && (
                    <Link to="/buddy" className="grid h-11 w-11 place-items-center rounded-2xl bg-gk/15 lg:hidden" aria-label="Ask Buddy"><BuddyBot size={34} /></Link>
                  )}
                </div>
              </div>
            </header>
          )}

          <main id="main" className={`mx-auto max-w-4xl px-4 ${focus ? "py-4" : "pb-28 pt-5 lg:pb-12"}`}>
            {timeUp ? <BreakTime name={child.name} minutes={limit} onGrownUp={() => setGate(true)} /> : children}
          </main>
        </div>

        {/* Mobile bottom nav */}
        {!focus && (
          <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-line bg-surface pb-[env(safe-area-inset-bottom,0px)] lg:hidden">
            <ul className="mx-auto grid max-w-lg grid-cols-6">
              {NAV.map((n) => {
                const active = isActive(nav.path, n.to);
                return (
                  <li key={n.to}>
                    <Link to={n.to} aria-current={active ? "page" : undefined} className="flex min-h-[62px] flex-col items-center justify-center gap-0.5 text-[0.72rem] font-extrabold">
                      <span className={`grid h-8 w-12 place-items-center rounded-full text-xl transition-colors ${active ? "bg-sun/40" : ""}`} aria-hidden="true">{n.icon}</span>
                      <span className={active ? "text-ink" : "text-muted"}>{n.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        )}
      </div>
      <ParentGate open={gate} onClose={() => setGate(false)} onPass={() => { setGate(false); nav.go("/parent"); }} />
    </PrefsContext.Provider>
  );
}

function BreakTime({ name, minutes, onGrownUp }: { name: string; minutes: number; onGrownUp: () => void }) {
  return (
    <div className="card mx-auto mt-6 grid max-w-md place-items-center gap-4 px-6 py-10 text-center">
      <span className="text-6xl animate-floaty" aria-hidden="true">🌙</span>
      <h1 className="text-3xl">Time for a break, {name}!</h1>
      <p className="text-muted">You learned for {minutes} minutes today — amazing! Go play, stretch or help at home. Your streak and stars are safe. ⭐</p>
      <ul className="grid w-full gap-2 text-left">
        {["🤸 Do 10 star jumps", "💧 Drink a glass of water", "📚 Read a paper book"].map((x) => <li key={x} className="rounded-2xl bg-sunken px-4 py-3 font-bold">{x}</li>)}
      </ul>
      <button className="text-sm font-bold text-muted underline underline-offset-4" onClick={onGrownUp}>Grown-up: change the time limit</button>
    </div>
  );
}
