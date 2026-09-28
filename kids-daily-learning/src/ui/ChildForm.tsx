"use client";
import { useState } from "react";
import { AVATARS } from "@/core/content/meta";
import { checkAge, checkChildName, LIMITS } from "@/core/validation";
import { Field } from "./primitives";

export interface ChildFormValue { name: string; age: number; avatar: string; }

export function ChildForm({ initial, submitLabel, onSubmit, onCancel }: {
  initial?: ChildFormValue;
  submitLabel: string;
  onSubmit: (v: ChildFormValue) => Promise<void>;
  onCancel?: () => void;
}) {
  const [v, setV] = useState<ChildFormValue>(initial ?? { name: "", age: 7, avatar: AVATARS[0] });
  const [err, setErr] = useState<{ name?: string | null; age?: string | null; form?: string | null }>({});
  const [busy, setBusy] = useState(false);
  const ages = Array.from({ length: LIMITS.maxAge - LIMITS.minAge + 1 }, (_, i) => LIMITS.minAge + i);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const e1 = { name: checkChildName(v.name), age: checkAge(v.age) };
    setErr(e1);
    if (e1.name || e1.age) return;
    setBusy(true);
    try { await onSubmit({ ...v, name: v.name.trim() }); }
    catch (x) { setErr({ form: (x as Error).message }); }
    finally { setBusy(false); }
  }

  return (
    <form className="grid gap-5" onSubmit={submit} noValidate>
      <Field label="First name or nickname" htmlFor="child-name" error={err.name} hint="No surname needed — we never ask for one.">
        <input id="child-name" className="field" value={v.name} maxLength={LIMITS.nameMax} autoComplete="off" onChange={(e) => setV({ ...v, name: e.target.value })} aria-invalid={!!err.name} />
      </Field>
      <fieldset className="grid gap-2">
        <legend className="mb-1.5 font-bold">Age</legend>
        <div className="grid grid-cols-5 gap-2 sm:grid-cols-9" role="radiogroup" aria-label="Age">
          {ages.map((a) => (
            <button key={a} type="button" role="radio" aria-checked={v.age === a} onClick={() => setV({ ...v, age: a })}
              className={`tnum min-h-[48px] rounded-2xl border-2 font-display text-xl font-semibold ${v.age === a ? "border-ink bg-sun" : "border-line bg-surface"}`}
              style={v.age === a ? { color: "#1D2340" } : undefined}>{a}</button>
          ))}
        </div>
        {err.age && <p className="text-sm font-bold text-oops" role="alert">{err.age}</p>}
        <p className="text-sm font-semibold text-muted">Used only to choose the right difficulty.</p>
      </fieldset>
      <fieldset className="grid gap-2">
        <legend className="mb-1.5 font-bold">Pick an avatar</legend>
        <div className="grid grid-cols-6 gap-2" role="radiogroup" aria-label="Avatar">
          {AVATARS.map((a) => (
            <button key={a} type="button" role="radio" aria-checked={v.avatar === a} aria-label={`Avatar ${a}`} onClick={() => setV({ ...v, avatar: a })}
              className={`grid aspect-square max-w-full place-items-center rounded-2xl border-2 text-3xl ${v.avatar === a ? "border-ink bg-sun/40" : "border-line bg-surface"}`}>{a}</button>
          ))}
        </div>
      </fieldset>
      {err.form && <p className="rounded-2xl bg-oops/10 px-4 py-3 font-bold text-oops" role="alert">{err.form}</p>}
      <div className="flex gap-3">
        {onCancel && <button type="button" className="btn-secondary flex-1" onClick={onCancel}>Cancel</button>}
        <button type="submit" className="btn-primary flex-1" disabled={busy}>{busy ? "Saving…" : submitLabel}</button>
      </div>
    </form>
  );
}
