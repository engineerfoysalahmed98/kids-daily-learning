"use client";
import { useMemo, useState } from "react";
import { useApp } from "@/state/AppProvider";
import { Modal } from "./primitives";

/**
 * Keeps children out of the parent area. With a PIN set, the PIN is checked
 * server-side; otherwise a grown-up multiplication question is used (a common
 * "parental gate" pattern in kids' apps).
 */
export function ParentGate({ open, onClose, onPass }: { open: boolean; onClose: () => void; onPass: () => void }) {
  const { service, session, refreshSession } = useApp();
  const hasPin = !!session?.parent?.hasPin;
  const q = useMemo(() => {
    const a = 6 + Math.floor(Math.random() * 7);
    const b = 6 + Math.floor(Math.random() * 4);
    return { a, b };
    // new question each time the gate opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!hasPin && Number(value) !== q.a * q.b) { setError("That's not quite right. Grown-ups only!"); setValue(""); return; }
    setBusy(true);
    try {
      await service.exitChildMode(hasPin ? value : undefined);
      await refreshSession();
      setValue("");
      onPass();
    } catch (err) {
      setError((err as Error).message);
      setValue("");
    } finally { setBusy(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title="Grown-ups only 🔒">
      <form onSubmit={submit} className="grid gap-4">
        <p className="text-muted">{hasPin ? "Enter your 4-digit parent PIN." : <>To open the parent area, answer: <strong className="text-ink">What is {q.a} × {q.b}?</strong></>}</p>
        <input
          id="parent-gate-input" className="field tnum text-center text-2xl tracking-[0.3em]" inputMode="numeric" autoComplete="off"
          type={hasPin ? "password" : "text"} maxLength={hasPin ? 4 : 3} value={value} onChange={(e) => setValue(e.target.value.replace(/\D/g, ""))}
          aria-label={hasPin ? "Parent PIN" : `Answer to ${q.a} times ${q.b}`} aria-invalid={!!error}
        />
        {error && <p className="text-sm font-bold text-oops" role="alert">{error}</p>}
        <div className="flex gap-3">
          <button type="button" className="btn-secondary flex-1" onClick={onClose}>Back</button>
          <button type="submit" className="btn-primary flex-1" disabled={!value || busy}>{busy ? "Checking…" : "Continue"}</button>
        </div>
      </form>
    </Modal>
  );
}
