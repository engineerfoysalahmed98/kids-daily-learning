/** Sound, speech and celebration helpers. All fail silently when unsupported. */

let ctx: AudioContext | null = null;
function audio(): AudioContext | null {
  try {
    if (!ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      ctx = AC ? new AC() : null;
    }
    if (ctx?.state === "suspended") void ctx.resume();
    return ctx;
  } catch { return null; }
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = "sine", gain = 0.12) {
  const a = audio();
  if (!a) return;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(0, a.currentTime + start);
  g.gain.linearRampToValueAtTime(gain, a.currentTime + start + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + start + dur);
  o.connect(g).connect(a.destination);
  o.start(a.currentTime + start);
  o.stop(a.currentTime + start + dur + 0.05);
}

export type Sfx = "correct" | "gentle" | "complete" | "badge" | "tap";

export function playSfx(kind: Sfx, enabled: boolean) {
  if (!enabled) return;
  switch (kind) {
    case "correct": tone(660, 0, 0.15); tone(880, 0.1, 0.25); break;
    case "gentle": tone(440, 0, 0.2, "triangle", 0.08); tone(494, 0.15, 0.25, "triangle", 0.07); break; // soft, never a "buzzer"
    case "complete": [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.11, 0.3)); break;
    case "badge": [784, 988, 1175, 1568].forEach((f, i) => tone(f, i * 0.09, 0.35, "triangle", 0.1)); break;
    case "tap": tone(520, 0, 0.06, "sine", 0.05); break;
  }
}

// ---------------------------------------------------------------- speech

export function canSpeak(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

function pickVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices().filter((v) => v.lang.startsWith("en"));
  const prefer = ["Samantha", "Google US English", "Microsoft Aria", "Microsoft Jenny", "Karen", "Moira", "Tessa"];
  return voices.find((v) => prefer.some((p) => v.name.includes(p))) ?? voices[0];
}

/** Child-friendly voice: a little slower and brighter than default. */
export function speak(text: string, opts: { onEnd?: () => void; onStart?: () => void } = {}): boolean {
  if (!canSpeak()) return false;
  const u = new SpeechSynthesisUtterance(text.replace(/[\p{Extended_Pictographic}]/gu, ""));
  u.rate = 0.9;
  u.pitch = 1.15;
  const v = pickVoice();
  if (v) u.voice = v;
  u.onstart = () => opts.onStart?.();
  u.onend = () => opts.onEnd?.();
  u.onerror = () => opts.onEnd?.();
  window.speechSynthesis.speak(u);
  return true;
}

export function stopSpeaking() {
  if (canSpeak()) window.speechSynthesis.cancel();
}

// ---------------------------------------------------------------- confetti

export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches || document.documentElement.classList.contains("reduce-motion"));
}

/** One short, soft confetti burst. Skipped under reduced motion. */
export function confetti(originY = 0.35) {
  if (typeof document === "undefined" || prefersReducedMotion()) return;
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  Object.assign(canvas.style, { position: "fixed", inset: "0", width: "100%", height: "100%", pointerEvents: "none", zIndex: "60" });
  document.body.appendChild(canvas);
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  const c = canvas.getContext("2d");
  if (!c) { canvas.remove(); return; }
  c.scale(dpr, dpr);
  const css = getComputedStyle(document.documentElement);
  const colors = ["sun", "english", "math", "science", "story", "brain"].map((n) => `rgb(${css.getPropertyValue(`--${n}`).trim().replace(/ /g, ",")})`);
  const W = window.innerWidth;
  const parts = Array.from({ length: 70 }, () => ({
    x: W / 2 + (Math.random() - 0.5) * 80, y: window.innerHeight * originY,
    vx: (Math.random() - 0.5) * 9, vy: -Math.random() * 9 - 3, r: Math.random() * 6 + 4,
    a: Math.random() * Math.PI, va: (Math.random() - 0.5) * 0.3, color: colors[Math.floor(Math.random() * colors.length)],
  }));
  const start = performance.now();
  const frame = (t: number) => {
    const elapsed = t - start;
    c.clearRect(0, 0, W, window.innerHeight);
    for (const p of parts) {
      p.vy += 0.25; p.x += p.vx; p.y += p.vy; p.a += p.va;
      c.save(); c.translate(p.x, p.y); c.rotate(p.a);
      c.globalAlpha = Math.max(0, 1 - elapsed / 1600);
      c.fillStyle = p.color; c.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2);
      c.restore();
    }
    if (elapsed < 1600) requestAnimationFrame(frame); else canvas.remove();
  };
  requestAnimationFrame(frame);
}
