"use client";
import { useEffect, useState } from "react";
import { useApp, useLoad } from "@/state/AppProvider";
import { useNav, Link } from "@/nav/nav";
import { Logo } from "@/ui/brand";
import { ChildForm } from "@/ui/ChildForm";
import { ErrorState, Modal, Skeleton } from "@/ui/primitives";
import { ParentGate } from "@/ui/ParentGate";
import { LIMITS } from "@/core/validation";

/** "Who's learning today?" — parent picks (or adds) a child, then the device enters kid mode. */
export function ProfilesScreen() {
  const { service, session, refreshSession } = useApp();
  const nav = useNav();
  const kids = useLoad((s) => (session?.parent ? s.listChildren() : Promise.resolve([])), [session?.parent?.id]);
  const [adding, setAdding] = useState(false);
  const [gate, setGate] = useState(false);
  const [entering, setEntering] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => { if (session && !session.parent) nav.go("/login", { replace: true }); }, [session, nav]);
  // Auto-open the add form for brand-new accounts.
  useEffect(() => { if (kids.data && kids.data.length === 0 && session?.mode !== "child") setAdding(true); }, [kids.data, session?.mode]);

  const childMode = session?.mode === "child";

  async function pick(id: string) {
    if (childMode && id !== session?.activeChildId) { setGate(true); return; }
    setEntering(id);
    setErr(null);
    try { await service.enterChildMode(id); await refreshSession(); nav.go("/home"); }
    catch (e) { setErr((e as Error).message); setEntering(null); }
  }

  return (
    <div className="min-h-dvh bg-bg px-4 py-8">
      <div className="mx-auto grid max-w-3xl gap-8">
        <div className="flex items-center justify-between gap-3">
          <Link to="/" aria-label="Home"><Logo compact /></Link>
          {childMode
            ? <button className="btn-ghost btn-sm" onClick={() => setGate(true)}>🔒 Grown-ups</button>
            : <Link to="/parent" className="btn-secondary btn-sm">📊 Parent Dashboard</Link>}
        </div>
        <div className="text-center">
          <h1 className="text-4xl sm:text-5xl">Who's learning today?</h1>
          <p className="mt-2 text-lg font-bold text-muted">Tap your picture to start.</p>
        </div>
        {kids.error ? <ErrorState error={kids.error} onRetry={kids.reload} /> : !kids.data ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3"><Skeleton className="h-48" /><Skeleton className="h-48" /></div>
        ) : (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {kids.data.map((c, i) => (
              <li key={c.id}>
                <button type="button" onClick={() => void pick(c.id)} disabled={!!entering}
                  className="card group grid w-full animate-rise place-items-center gap-2 p-6 transition hover:-translate-y-1 hover:border-sun" style={{ animationDelay: `${i * 60}ms` }}>
                  <span className="grid h-24 w-24 place-items-center rounded-[1.75rem] bg-sun/30 text-6xl transition group-hover:scale-105" aria-hidden="true">{c.avatar}</span>
                  <span className="font-display text-2xl font-semibold">{c.name}</span>
                  <span className="text-sm font-extrabold text-muted">{entering === c.id ? "Opening…" : `Age ${c.age}`}</span>
                </button>
              </li>
            ))}
            {!childMode && kids.data.length < LIMITS.maxChildren && (
              <li>
                <button type="button" onClick={() => setAdding(true)} className="grid h-full min-h-[200px] w-full place-items-center content-center gap-2 rounded-card border-[3px] border-dashed border-line p-6 font-bold text-muted hover:border-math hover:text-ink">
                  <span className="grid h-16 w-16 place-items-center rounded-full bg-sunken text-4xl" aria-hidden="true">+</span>
                  Add a child
                </button>
              </li>
            )}
          </ul>
        )}
        {err && <p className="text-center font-bold text-oops" role="alert">{err}</p>}
      </div>

      <Modal open={adding} onClose={() => setAdding(false)} title="Add a child">
        <ChildForm submitLabel="Add child" onCancel={() => setAdding(false)}
          onSubmit={async (v) => { await service.createChild(v); setAdding(false); }} />
      </Modal>
      <ParentGate open={gate} onClose={() => setGate(false)} onPass={() => setGate(false)} />
    </div>
  );
}
