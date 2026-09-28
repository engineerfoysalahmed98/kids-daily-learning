"use client";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { STROKE_VAR, SOLID, TINT, type Tone } from "./colors";
import { BuddyBot } from "./brand";

export function ProgressBar({ value, max = 100, tone = "sun", label, size = "md" }: { value: number; max?: number; tone?: Tone; label: string; size?: "sm" | "md" }) {
  const pct = Math.max(0, Math.min(100, max ? (value / max) * 100 : 0));
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={Math.round(value)}
      className={`w-full overflow-hidden rounded-full bg-sunken ${size === "sm" ? "h-2.5" : "h-4"}`}>
      <div className={`h-full rounded-full ${SOLID[tone]} transition-[width] duration-700 ease-out`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Ring({ value, max, size = 76, tone = "sun", children, label }: { value: number; max: number; size?: number; tone?: Tone; children?: ReactNode; label: string }) {
  const r = (size - 10) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, max ? value / max : 0));
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }} role="img" aria-label={label}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(var(--sunken))" strokeWidth="10" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={STROKE_VAR[tone]} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct)} style={{ transition: "stroke-dashoffset .8s ease-out" }} />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}

export function Stars({ count, max = 3, size = "text-2xl", animate = false }: { count: number; max?: number; size?: string; animate?: boolean }) {
  return (
    <span className={`inline-flex gap-1 ${size}`} role="img" aria-label={`${count} of ${max} stars`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={`${i < count ? "" : "opacity-25 grayscale"} ${animate && i < count ? "animate-pop" : ""}`} style={animate ? { animationDelay: `${0.25 + i * 0.18}s` } : undefined} aria-hidden="true">⭐</span>
      ))}
    </span>
  );
}

export function Blob({ tone, emoji, size = "md", label }: { tone: Tone; emoji: string; size?: "sm" | "md" | "lg" | "xl"; label?: string }) {
  const s = { sm: "h-10 w-10 text-xl rounded-xl", md: "h-14 w-14 text-3xl rounded-2xl", lg: "h-20 w-20 text-5xl rounded-3xl", xl: "h-28 w-28 text-6xl rounded-[2rem]" }[size];
  return (
    <span className={`inline-grid shrink-0 place-items-center ${s} ${TINT[tone]}`} role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <span className="leading-none">{emoji}</span>
    </span>
  );
}

export function StatChip({ icon, value, label, tone = "sun" }: { icon: string; value: ReactNode; label: string; tone?: Tone }) {
  return (
    <div className={`flex items-center gap-2.5 rounded-2xl px-3 py-2.5 ${TINT[tone]}`}>
      <span className="text-2xl leading-none" aria-hidden="true">{icon}</span>
      <span className="min-w-0 leading-tight">
        <span className="tnum block font-display text-xl font-semibold">{value}</span>
        <span className="block truncate text-xs font-bold text-muted">{label}</span>
      </span>
    </div>
  );
}

export function Toggle({ checked, onChange, label, description, id }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string; id?: string }) {
  const autoId = useId();
  const tid = id ?? autoId;
  return (
    <div className="flex min-h-[56px] items-center justify-between gap-4 py-2">
      <label htmlFor={tid} className="min-w-0 cursor-pointer">
        <span className="block font-bold">{label}</span>
        {description && <span className="block text-sm font-semibold text-muted">{description}</span>}
      </label>
      <button id={tid} type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
        className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${checked ? "bg-good" : "bg-line"}`}>
        <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-[left] ${checked ? "left-7" : "left-1"}`} />
      </button>
    </div>
  );
}

export function Spinner({ label = "Loading" }: { label?: string }) {
  return (
    <div className="grid place-items-center gap-3 py-16 text-muted" role="status" aria-live="polite">
      <div className="flex gap-2" aria-hidden="true">
        {[0, 1, 2].map((i) => <span key={i} className="h-3.5 w-3.5 animate-bounce rounded-full bg-sun" style={{ animationDelay: `${i * 0.15}s` }} />)}
      </div>
      <span className="text-sm font-bold">{label}…</span>
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-card bg-sunken ${className}`} aria-hidden="true" />;
}

export function EmptyState({ emoji = "🌱", title, body, action }: { emoji?: string; title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="card grid place-items-center gap-3 px-6 py-10 text-center">
      <span className="text-5xl" aria-hidden="true">{emoji}</span>
      <h3 className="text-xl">{title}</h3>
      {body && <p className="max-w-sm text-muted">{body}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: Error; onRetry?: () => void }) {
  return (
    <div className="card grid place-items-center gap-3 px-6 py-10 text-center" role="alert">
      <BuddyBot size={64} mood="thinking" />
      <h3 className="text-xl">Oops, that didn't load</h3>
      <p className="max-w-sm text-muted">{error.message}</p>
      {onRetry && <button className="btn-secondary btn-sm" onClick={onRetry}>Try again</button>}
    </div>
  );
}

export function Modal({ open, onClose, title, children, labelledBy }: { open: boolean; onClose: () => void; title?: string; children: ReactNode; labelledBy?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const el = ref.current;
    const focusables = () => Array.from(el?.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') ?? []).filter((x) => !x.hasAttribute("disabled"));
    (focusables()[0] ?? el)?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const f = focusables();
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("keydown", onKey); prev?.focus?.(); };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#0B1030]/55 px-4 py-6" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={labelledBy ?? (title ? titleId : undefined)} tabIndex={-1}
        className="card max-h-full w-full max-w-md animate-pop overflow-y-auto p-6 shadow-soft">
        {title && <h2 id={titleId} className="mb-4 text-2xl">{title}</h2>}
        {children}
      </div>
    </div>
  );
}

export function Field({ label, error, hint, children, htmlFor }: { label: string; error?: string | null; hint?: string; children: ReactNode; htmlFor: string }) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={htmlFor} className="font-bold">{label}</label>
      {children}
      {error ? <p className="text-sm font-bold text-oops" role="alert">{error}</p> : hint ? <p className="text-sm font-semibold text-muted">{hint}</p> : null}
    </div>
  );
}

export function Toast({ message, onDone }: { message: string | null; onDone: () => void }) {
  const [shown, setShown] = useState<string | null>(null);
  const done = useRef(onDone);
  done.current = onDone;
  useEffect(() => {
    if (!message) return;
    setShown(message);
    const t = setTimeout(() => { setShown(null); done.current(); }, 2600);
    return () => clearTimeout(t);
  }, [message]);
  if (!shown) return null;
  return (
    <div role="status" aria-live="polite" className="fixed inset-x-0 bottom-24 z-50 mx-auto w-fit max-w-[90vw] animate-rise rounded-2xl bg-ink px-5 py-3 font-bold text-bg shadow-soft lg:bottom-8">
      {shown}
    </div>
  );
}

/** Animated number (XP count-up). Jumps straight to the value under reduced motion. */
export function CountUp({ to, from = 0, duration = 900 }: { to: number; from?: number; duration?: number }) {
  const [v, setV] = useState(from);
  useEffect(() => {
    const reduce = typeof window !== "undefined" && (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches || document.documentElement.classList.contains("reduce-motion"));
    if (reduce) { setV(to); return; }
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / duration);
      setV(Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, from, duration]);
  return <span className="tnum">{v}</span>;
}
