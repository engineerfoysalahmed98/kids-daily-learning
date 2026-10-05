"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="grid min-h-dvh place-items-center bg-bg px-4 text-center">
      <div className="card grid max-w-sm place-items-center gap-3 p-8" role="alert">
        <span className="text-5xl" aria-hidden="true">🤖</span>
        <h1 className="text-2xl">Oops, something went wrong</h1>
        <p className="text-muted">Let&apos;s try that again.</p>
        <button className="btn-primary" onClick={reset}>Try again</button>
      </div>
    </main>
  );
}
