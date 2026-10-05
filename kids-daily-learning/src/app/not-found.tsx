import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-bg px-4 text-center">
      <div className="card grid max-w-sm place-items-center gap-3 p-8">
        <span className="text-5xl" aria-hidden="true">🧭</span>
        <h1 className="text-2xl">We couldn&apos;t find that page</h1>
        <Link href="/" className="btn-primary">Go home</Link>
      </div>
    </main>
  );
}
