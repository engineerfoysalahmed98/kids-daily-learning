"use client";
import { useApp } from "@/state/AppProvider";
import { Link } from "@/nav/nav";
import { Logo } from "./brand";
import { ChildForm, type ChildFormValue } from "./ChildForm";
import { GUEST_CHILD_ID } from "@/state/guestService";

/**
 * First step for a visitor without an account: a nickname, age and avatar so
 * activities match the child's age. Stored on this device only.
 * With `initial`, edits the existing guest learner instead.
 */
export function GuestSetup({ initial, onDone, onCancel }: { initial?: ChildFormValue; onDone?: () => void; onCancel?: () => void }) {
  const { service, refreshSession } = useApp();
  async function save(v: ChildFormValue) {
    if (initial) await service.updateChild(GUEST_CHILD_ID, v);
    else await service.createChild(v);
    await refreshSession();
    onDone?.();
  }
  const form = <ChildForm initial={initial} submitLabel={initial ? "Save" : "Start learning ▶"} onSubmit={save} onCancel={onCancel} />;
  if (initial) return form;
  return (
    <div className="min-h-dvh bg-bg px-4 py-8">
      <div className="mx-auto grid max-w-lg gap-6">
        <Link to="/" aria-label="Home" className="w-fit"><Logo compact /></Link>
        <div className="text-center">
          <h1 className="text-4xl sm:text-5xl">Who&apos;s learning today?</h1>
          <p className="mt-2 text-lg font-bold text-muted">Pick a nickname, your age and an animal friend.</p>
        </div>
        <div className="card p-5 sm:p-6">{form}</div>
        <p className="text-center text-sm font-bold text-muted">
          No account needed. Progress is saved on this device.
        </p>
      </div>
    </div>
  );
}
