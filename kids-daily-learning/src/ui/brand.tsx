/** Logo mark: a rising sun over an open book — "learn something every day". */
export function LogoMark({ size = 40, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden="true">
      <g stroke="rgb(var(--sun-deep))" strokeWidth="3.5" strokeLinecap="round">
        <path d="M32 6v6M14 13l4 4.5M50 13l-4 4.5M7 29h6M51 29h6" />
      </g>
      <circle cx="32" cy="33" r="15" fill="rgb(var(--sun))" />
      <circle cx="26.5" cy="30" r="2" fill="#1D2340" />
      <circle cx="37.5" cy="30" r="2" fill="#1D2340" />
      <path d="M26 35.5c3.4 3 8.6 3 12 0" stroke="#1D2340" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <path d="M6 42c9-4 18-3 26 3 8-6 17-7 26-3v14c-9-4-18-3-26 3-8-6-17-7-26-3z" fill="rgb(var(--math))" />
      <path d="M32 45v14" stroke="rgb(var(--surface))" strokeWidth="2.5" />
      <path d="M11 47c6-2 11-1 16 2M37 49c5-3 10-4 16-2" stroke="rgb(var(--surface))" strokeWidth="2" opacity=".6" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ compact = false, className = "" }: { compact?: boolean; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark size={compact ? 34 : 42} />
      <span className="font-display leading-none">
        <span className={`block font-semibold ${compact ? "text-lg" : "text-xl"}`}>Kids Daily</span>
        <span className={`block font-semibold text-muted ${compact ? "text-sm" : "text-base"}`}>Learning</span>
      </span>
    </span>
  );
}

/** Buddy 🤖 — the learning assistant mascot. */
export function BuddyBot({ size = 64, mood = "happy", className = "" }: { size?: number; mood?: "happy" | "thinking" | "wave"; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" className={className} role="img" aria-label="Buddy the robot">
      <line x1="40" y1="6" x2="40" y2="16" stroke="rgb(var(--ink))" strokeWidth="3" strokeLinecap="round" />
      <circle cx="40" cy="6" r="4.5" fill="rgb(var(--flame))" />
      <rect x="12" y="16" width="56" height="44" rx="18" fill="rgb(var(--gk))" />
      <rect x="19" y="23" width="42" height="28" rx="12" fill="#EFFFFB" />
      {mood === "thinking" ? (
        <>
          <path d="M28 36h7M45 36h7" stroke="#1D2340" strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="40" cy="45" r="2.5" fill="#1D2340" />
        </>
      ) : (
        <>
          <circle cx="31" cy="35" r="4" fill="#1D2340" />
          <circle cx="49" cy="35" r="4" fill="#1D2340" />
          <circle cx="32.3" cy="33.6" r="1.3" fill="#fff" />
          <circle cx="50.3" cy="33.6" r="1.3" fill="#fff" />
          <path d="M33 43c4 3.5 10 3.5 14 0" stroke="#1D2340" strokeWidth="3" fill="none" strokeLinecap="round" />
        </>
      )}
      <circle cx="23" cy="44" r="3" fill="rgb(var(--english))" opacity=".5" />
      <circle cx="57" cy="44" r="3" fill="rgb(var(--english))" opacity=".5" />
      <rect x="26" y="60" width="28" height="12" rx="5" fill="rgb(var(--gk))" opacity=".75" />
      {mood === "wave" ? <path d="M68 38c6-2 8-8 7-13" stroke="rgb(var(--gk))" strokeWidth="6" strokeLinecap="round" fill="none" /> : <rect x="4" y="32" width="8" height="16" rx="4" fill="rgb(var(--gk))" />}
      {mood !== "wave" && <rect x="68" y="32" width="8" height="16" rx="4" fill="rgb(var(--gk))" />}
    </svg>
  );
}
