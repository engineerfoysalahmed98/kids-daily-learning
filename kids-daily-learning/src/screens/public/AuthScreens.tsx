"use client";
import { useEffect, useState } from "react";
import { useApp } from "@/state/AppProvider";
import { useNav, Link } from "@/nav/nav";
import { checkDisplayName, checkEmail, checkPassword } from "@/core/validation";
import { ServiceError } from "@/state/service";
import { Logo } from "@/ui/brand";
import { Field } from "@/ui/primitives";

function AuthFrame({ title, sub, children, footer }: { title: string; sub: string; children: React.ReactNode; footer: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-bg px-4 py-8">
      <div className="mx-auto grid max-w-md gap-6">
        <Link to="/" className="mx-auto" aria-label="Kids Daily Learning home"><Logo /></Link>
        <div className="card grid gap-5 p-6 sm:p-8">
          <div>
            <p className="label">For parents & guardians</p>
            <h1 className="text-3xl">{title}</h1>
            <p className="mt-1 text-muted">{sub}</p>
          </div>
          {children}
        </div>
        <div className="text-center font-bold text-muted">{footer}</div>
      </div>
    </div>
  );
}

export function SignUpScreen() {
  const { service, session, refreshSession } = useApp();
  const nav = useNav();
  const [form, setForm] = useState({ displayName: "", email: "", password: "", agree: false });
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (session?.parent) nav.go("/profiles", { replace: true }); }, [session, nav]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs = { displayName: checkDisplayName(form.displayName), email: checkEmail(form.email), password: checkPassword(form.password), agree: form.agree ? null : "Please confirm you're a parent or guardian." };
    setErrors(errs);
    if (Object.values(errs).some(Boolean)) return;
    setBusy(true);
    setFormError(null);
    try {
      await service.signUp({ displayName: form.displayName, email: form.email, password: form.password });
      await refreshSession();
      nav.go("/profiles?new=1", { replace: true });
    } catch (err) {
      const se = err as ServiceError;
      if (se.field) setErrors((x) => ({ ...x, [se.field!]: se.message })); else setFormError(se.message);
    } finally { setBusy(false); }
  }

  return (
    <AuthFrame title="Create your parent account" sub="Takes one minute. You'll add your children next." footer={<>Already have an account? <Link to="/login" className="text-ink underline underline-offset-4">Log in</Link></>}>
      <form className="grid gap-4" onSubmit={submit} noValidate>
        <Field label="Your first name" htmlFor="su-name" error={errors.displayName}>
          <input id="su-name" className="field" autoComplete="given-name" value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} aria-invalid={!!errors.displayName} />
        </Field>
        <Field label="Email" htmlFor="su-email" error={errors.email}>
          <input id="su-email" className="field" type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} aria-invalid={!!errors.email} />
        </Field>
        <Field label="Password" htmlFor="su-pw" error={errors.password} hint="At least 8 characters, with a letter and a number.">
          <input id="su-pw" className="field" type="password" autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} aria-invalid={!!errors.password} />
        </Field>
        <label className="flex cursor-pointer items-start gap-3 font-semibold">
          <input id="su-agree" type="checkbox" className="mt-1 h-6 w-6 accent-[rgb(var(--math))]" checked={form.agree} onChange={(e) => setForm({ ...form, agree: e.target.checked })} />
          <span>I&apos;m a parent or legal guardian, and I&apos;ve read the <Link to="/safety" className="underline">Privacy & Safety</Link> page.</span>
        </label>
        {errors.agree && <p className="-mt-2 text-sm font-bold text-oops" role="alert">{errors.agree}</p>}
        {formError && <p className="rounded-2xl bg-oops/10 px-4 py-3 font-bold text-oops" role="alert">{formError}</p>}
        <button className="btn-primary w-full" disabled={busy}>{busy ? "Creating account…" : "Create account"}</button>
      </form>
    </AuthFrame>
  );
}

export function LoginScreen() {
  const { service, session, refreshSession } = useApp();
  const nav = useNav();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (session?.parent) nav.go(session.mode === "child" ? "/home" : "/profiles", { replace: true }); }, [session, nav]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(checkEmail(email) ?? (password ? null : "Enter your password."));
    if (checkEmail(email) || !password) return;
    setBusy(true);
    try {
      await service.logIn({ email, password });
      await refreshSession();
      nav.go("/profiles", { replace: true });
    } catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  }

  return (
    <AuthFrame title="Welcome back" sub="Log in to pick a learner or see progress." footer={<>New here? <Link to="/signup" className="text-ink underline underline-offset-4">Create an account</Link></>}>
      {service.mode === "mock" && (
        <div className="grid gap-2 rounded-2xl bg-sun/20 p-4">
          <p className="font-bold">Demo account</p>
          <p className="text-sm font-semibold text-muted">demo@kidsdaily.app · learn2day — two children (Ayaan, 7 and Maya, 10) with two weeks of history.</p>
          <button type="button" className="btn-secondary btn-sm w-fit" onClick={() => { setEmail("demo@kidsdaily.app"); setPassword("learn2day"); }}>Fill demo login</button>
        </div>
      )}
      <form className="grid gap-4" onSubmit={submit} noValidate>
        <Field label="Email" htmlFor="li-email">
          <input id="li-email" className="field" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Password" htmlFor="li-pw">
          <input id="li-pw" className="field" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        {error && <p className="rounded-2xl bg-oops/10 px-4 py-3 font-bold text-oops" role="alert">{error}</p>}
        <button className="btn-primary w-full" disabled={busy}>{busy ? "Logging in…" : "Log in"}</button>
      </form>
    </AuthFrame>
  );
}
