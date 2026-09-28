"use client";
import { useState } from "react";
import type { Child, Track } from "@/core/types";
import { ALL_TRACKS } from "@/core/types";
import { TRACK_META } from "@/core/content/meta";
import { checkPin, LIMITS } from "@/core/validation";
import { useApp } from "@/state/AppProvider";
import { useNav } from "@/nav/nav";
import { ParentShell } from "@/ui/shells/ParentShell";
import { ChildForm } from "@/ui/ChildForm";
import { EmptyState, ErrorState, Field, Modal, Skeleton, Toast, Toggle } from "@/ui/primitives";
import { ChildSwitcher, useFamily, useSelectedChild } from "./common";

// ---------------------------------------------------------------- Children

function ChildrenBody() {
  const { service, refreshSession } = useApp();
  const nav = useNav();
  const fam = useFamily();
  const [editing, setEditing] = useState<Child | "new" | null>(null);
  const [deleting, setDeleting] = useState<Child | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  if (fam.error) return <ErrorState error={fam.error} onRetry={fam.reload} />;
  if (!fam.data) return <Skeleton className="h-64" />;
  const kids = fam.data.children;

  return (
    <div className="grid gap-5">
      <p className="text-muted">Each child has their own XP, progress, badges, history and recommendations. We only store a first name, age and avatar.</p>
      {kids.length === 0 ? (
        <EmptyState emoji="👧" title="No children yet" body="Add a profile to get started." action={<button className="btn-primary" onClick={() => setEditing("new")}>Add a child</button>} />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {kids.map((c) => {
            const p = fam.data!.progress[c.id];
            return (
              <li key={c.id} className="card grid gap-4 p-5">
                <div className="flex items-center gap-4">
                  <span className="grid h-16 w-16 place-items-center rounded-2xl bg-sun/30 text-4xl" aria-hidden="true">{c.avatar}</span>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-2xl">{c.name}</h2>
                    <p className="font-bold text-muted">Age {c.age} · {p.completions.filter((x) => !x.repeat).length} activities · {p.badges.length} badges</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button className="btn-primary btn-sm" onClick={async () => { await service.enterChildMode(c.id); await refreshSession(); nav.go("/home"); }}>▶ Start learning</button>
                  <button className="btn-secondary btn-sm" onClick={() => setEditing(c)}>Edit</button>
                  <button className="btn-ghost btn-sm text-oops" onClick={() => { setDeleting(c); setConfirmText(""); }}>Delete</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {kids.length > 0 && kids.length < LIMITS.maxChildren && <button className="btn-secondary w-fit" onClick={() => setEditing("new")}>+ Add another child</button>}

      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing === "new" ? "Add a child" : `Edit ${editing?.name ?? ""}`}>
        {editing !== null && (
          <ChildForm
            initial={editing === "new" ? undefined : { name: editing.name, age: editing.age, avatar: editing.avatar }}
            submitLabel={editing === "new" ? "Add child" : "Save changes"}
            onCancel={() => setEditing(null)}
            onSubmit={async (v) => {
              if (editing === "new") { await service.createChild(v); setToast(`${v.name} added`); }
              else { await service.updateChild(editing.id, v); setToast("Saved"); }
              setEditing(null);
            }} />
        )}
      </Modal>

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title={`Delete ${deleting?.name}'s profile?`}>
        <div className="grid gap-4">
          <p className="text-muted">This permanently removes {deleting?.name}'s XP, badges, streak and learning history. It can't be undone.</p>
          <Field label={`Type ${deleting?.name} to confirm`} htmlFor="del-confirm">
            <input id="del-confirm" className="field" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} autoComplete="off" />
          </Field>
          <div className="flex gap-3">
            <button className="btn-secondary flex-1" onClick={() => setDeleting(null)}>Keep profile</button>
            <button className="btn flex-1 bg-oops text-white" disabled={confirmText.trim() !== deleting?.name}
              onClick={async () => { if (!deleting) return; await service.deleteChild(deleting.id); setToast(`${deleting.name}'s profile deleted`); setDeleting(null); }}>Delete</button>
          </div>
        </div>
      </Modal>
      <Toast message={toast} onDone={() => setToast(null)} />
    </div>
  );
}
export function ChildrenScreen() { return <ParentShell title="Children"><ChildrenBody /></ParentShell>; }

// ---------------------------------------------------------------- Settings

const SCREEN_OPTIONS = [15, 30, 45, 60, 90, 120, 0];

function SettingsBody() {
  const { service, session, refreshSession } = useApp();
  const nav = useNav();
  const fam = useFamily();
  const { child, select } = useSelectedChild(fam.data?.children);
  const [toast, setToast] = useState<string | null>(null);
  const [pin, setPin] = useState("");
  const [pinErr, setPinErr] = useState<string | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const parent = session?.parent;

  if (fam.error) return <ErrorState error={fam.error} onRetry={fam.reload} />;
  if (!fam.data || !parent) return <Skeleton className="h-96" />;

  const save = async (patch: Parameters<typeof service.updateChild>[1], msg = "Saved") => {
    if (!child) return;
    try { await service.updateChild(child.id, patch); setToast(msg); } catch (e) { setToast((e as Error).message); }
  };
  const toggleTrack = (t: Track, on: boolean) => {
    if (!child) return;
    const next = on ? [...child.settings.allowedTracks, t] : child.settings.allowedTracks.filter((x) => x !== t);
    if (next.length === 0) { setToast("Keep at least one subject switched on."); return; }
    void save({ settings: { allowedTracks: ALL_TRACKS.filter((x) => next.includes(x)) } });
  };

  return (
    <div className="grid gap-5">
      {child ? (
        <>
          <ChildSwitcher children={fam.data.children} selected={child.id} onSelect={select} />
          <section className="card grid gap-2 p-5" aria-labelledby="learning">
            <h2 id="learning" className="text-xl">{child.avatar} {child.name}'s learning</h2>
            <div className="flex min-h-[56px] items-center justify-between gap-4 py-2">
              <span><span className="block font-bold">Daily learning goal</span><span className="block text-sm font-semibold text-muted">Activities per day that complete the goal</span></span>
              <div className="flex items-center gap-2" role="group" aria-label="Daily goal">
                <button className="btn-secondary btn-sm w-11 px-0" aria-label="Fewer" disabled={child.settings.dailyGoal <= 1} onClick={() => save({ settings: { dailyGoal: child.settings.dailyGoal - 1 } })}>−</button>
                <span className="tnum w-8 text-center font-display text-2xl font-semibold" aria-live="polite">{child.settings.dailyGoal}</span>
                <button className="btn-secondary btn-sm w-11 px-0" aria-label="More" disabled={child.settings.dailyGoal >= 7} onClick={() => save({ settings: { dailyGoal: child.settings.dailyGoal + 1 } })}>+</button>
              </div>
            </div>
            <div className="flex min-h-[56px] flex-wrap items-center justify-between gap-3 py-2">
              <label htmlFor="screen-time"><span className="block font-bold">Screen-time limit</span><span className="block text-sm font-semibold text-muted">A friendly break screen appears when time's up</span></label>
              <select id="screen-time" className="field w-auto min-w-[9rem]" value={child.settings.screenTimeMinutes} onChange={(e) => save({ settings: { screenTimeMinutes: Number(e.target.value) } })}>
                {SCREEN_OPTIONS.map((m) => <option key={m} value={m}>{m ? `${m} minutes` : "No limit"}</option>)}
              </select>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="btn-ghost btn-sm" onClick={async () => { await service.addUsage(child.id, -15 * 60); setToast(`Gave ${child.name} 15 more minutes today`); }}>+15 min today</button>
            </div>
            <Toggle id="ai" label="Buddy AI assistant" description="Safe, learning-only helper. Rate-limited." checked={child.settings.aiEnabled} onChange={(v) => save({ settings: { aiEnabled: v } }, v ? "Buddy switched on" : "Buddy switched off")} />
            <Toggle id="sound" label="Sound effects" description="Gentle chimes for answers and rewards" checked={child.settings.soundOn} onChange={(v) => save({ settings: { soundOn: v } })} />
            <Toggle id="large" label="Large text" description="Bigger letters on every screen" checked={child.settings.largeText} onChange={(v) => save({ settings: { largeText: v } })} />
          </section>

          <section className="card grid gap-1 p-5" aria-labelledby="subjects">
            <h2 id="subjects" className="text-xl">Allowed subjects</h2>
            <p className="text-sm font-semibold text-muted">Switched-off subjects disappear from Today's Adventure, Learn and Games.</p>
            <div className="grid gap-x-8 sm:grid-cols-2">
              {ALL_TRACKS.map((t) => (
                <Toggle key={t} id={`track-${t}`} label={`${TRACK_META[t].icon} ${TRACK_META[t].label}`} checked={child.settings.allowedTracks.includes(t)} onChange={(v) => toggleTrack(t, v)} />
              ))}
            </div>
          </section>
        </>
      ) : (
        <EmptyState title="No children yet" body="Add a child to set learning controls." />
      )}

      <section className="card grid gap-1 p-5" aria-labelledby="notif">
        <h2 id="notif" className="text-xl">Notifications</h2>
        <p className="text-sm font-semibold text-muted">Shown on your dashboard. <span className="font-bold">▶ Production:</span> also sent by email/push through the notification worker.</p>
        <Toggle id="n-activity" label="Activity completed" description="“Your child completed today's Math activity.”" checked={parent.notifications.activity} onChange={(v) => service.updateParent({ notifications: { activity: v } }).then(() => setToast("Saved"))} />
        <Toggle id="n-badge" label="New badge" description="“Your child earned a new badge.”" checked={parent.notifications.badge} onChange={(v) => service.updateParent({ notifications: { badge: v } }).then(() => setToast("Saved"))} />
        <Toggle id="n-goal" label="Daily goal complete" description="“Today's learning goal is complete.”" checked={parent.notifications.goal} onChange={(v) => service.updateParent({ notifications: { goal: v } }).then(() => setToast("Saved"))} />
      </section>

      <section className="card grid gap-3 p-5" aria-labelledby="pin">
        <h2 id="pin" className="text-xl">Parent PIN</h2>
        <p className="text-sm font-semibold text-muted">{parent.hasPin ? "A PIN is set. Children need it to open the parent area." : "Without a PIN, a grown-up math question guards the parent area. A PIN is stronger."}</p>
        <form className="flex flex-wrap items-end gap-2" onSubmit={async (e) => {
          e.preventDefault();
          const err = checkPin(pin); setPinErr(err); if (err) return;
          await service.setPin(pin); setPin(""); setToast("PIN saved");
        }}>
          <Field label={parent.hasPin ? "New 4-digit PIN" : "4-digit PIN"} htmlFor="pin-input" error={pinErr}>
            <input id="pin-input" className="field tnum w-40 tracking-[0.3em]" inputMode="numeric" type="password" maxLength={4} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} autoComplete="new-password" />
          </Field>
          <button className="btn-primary btn-sm">{parent.hasPin ? "Change PIN" : "Set PIN"}</button>
          {parent.hasPin && <button type="button" className="btn-ghost btn-sm" onClick={async () => { await service.setPin(null); setToast("PIN removed"); }}>Remove PIN</button>}
        </form>
      </section>

      <section className="card grid gap-3 p-5" aria-labelledby="account">
        <h2 id="account" className="text-xl">Account</h2>
        <dl className="grid gap-1 text-sm"><div className="flex gap-2"><dt className="font-bold text-muted">Signed in as</dt><dd className="font-bold">{parent.displayName} · {parent.email}</dd></div></dl>
        <div className="flex flex-wrap gap-2">
          <button className="btn-secondary btn-sm" onClick={async () => { await service.logOut(); await refreshSession(); nav.go("/"); }}>Log out</button>
          {service.resetDemo && <button className="btn-ghost btn-sm" onClick={() => setResetOpen(true)}>Reset demo data</button>}
        </div>
      </section>

      <Modal open={resetOpen} onClose={() => setResetOpen(false)} title="Reset the demo?">
        <p className="text-muted">This restores the demo family (Ayaan and Maya) and removes accounts and progress created in this browser.</p>
        <div className="mt-5 flex gap-3">
          <button className="btn-secondary flex-1" onClick={() => setResetOpen(false)}>Cancel</button>
          <button className="btn-primary flex-1" onClick={async () => { await service.resetDemo?.(); await refreshSession(); setResetOpen(false); nav.go("/login"); }}>Reset</button>
        </div>
      </Modal>
      <Toast message={toast} onDone={() => setToast(null)} />
    </div>
  );
}
export function ParentSettingsScreen() { return <ParentShell title="Settings"><SettingsBody /></ParentShell>; }
