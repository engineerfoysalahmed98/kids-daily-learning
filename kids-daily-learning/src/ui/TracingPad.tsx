"use client";
import { useCallback, useEffect, useRef, useState, type PointerEvent as RPointerEvent } from "react";

/**
 * Finger/mouse tracing over a faint letter.
 *
 * The letter is drawn on a guide canvas with the page's own font; a coarse
 * grid of "guide cells" is read back from it. When the child presses
 * "check", we accept the tracing if it covers most of the letter and stays
 * mostly on it. The check is deliberately generous — this is practice, not a
 * test. Keyboard users (and children writing on paper) can use the
 * "I wrote it" button instead.
 */

const SIZE = 280;
const CELL = 14;
const GRID = SIZE / CELL;
const MIN_COVER = 0.55;
const MAX_OUTSIDE = 0.45;

type Pt = { x: number; y: number };

const TEXT = {
  bn: {
    canvas: (g: string) => `${g} অক্ষরটি আঙুল দিয়ে লেখার জায়গা`,
    check: "মিলিয়ে দেখো ✅", clear: "মুছে ফেলো 🧽", paper: "কাগজে লিখেছি ✍️",
    good: "দারুণ! একদম ঠিকঠাক লিখেছ! 🎉",
    more: "আরেকটু! ধূসর অক্ষরের পুরোটার উপর দিয়ে আঙুল টানো। 💪",
    off: "অক্ষরের বাইরে একটু বেশি চলে গেছে। মুছে আবার চেষ্টা করো! 🙂",
    empty: "আগে অক্ষরের উপর দিয়ে আঙুল বা মাউস টেনে লেখো।",
    hint: "ধূসর অক্ষরের উপর দিয়ে আঙুল বা মাউস টেনে লেখো।",
  },
  en: {
    canvas: (g: string) => `Tracing space for the letter ${g}`,
    check: "Check ✅", clear: "Clear 🧽", paper: "I wrote it on paper ✍️",
    good: "Brilliant! You traced it! 🎉",
    more: "Almost! Go over the whole grey letter. 💪",
    off: "A little outside the letter. Clear and try again! 🙂",
    empty: "First trace over the letter with your finger or mouse.",
    hint: "Trace over the grey letter with your finger or mouse.",
  },
} as const;

function cssColor(el: Element, name: string, alpha: number, fallback: string): string {
  const v = getComputedStyle(el).getPropertyValue(name).trim();
  return v ? `rgb(${v} / ${alpha})` : fallback;
}

function dilate(cells: Set<number>): Set<number> {
  const out = new Set<number>();
  for (const c of cells) {
    const x = c % GRID, y = Math.floor(c / GRID);
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
      const nx = x + dx, ny = y + dy;
      if (nx >= 0 && ny >= 0 && nx < GRID && ny < GRID) out.add(ny * GRID + nx);
    }
  }
  return out;
}

/** Pure scoring, exported for tests. */
export function scoreTrace(guide: Set<number>, stroke: Set<number>): { cover: number; outside: number; ok: boolean } {
  if (!guide.size || !stroke.size) return { cover: 0, outside: stroke.size ? 1 : 0, ok: false };
  const nearStroke = dilate(stroke);
  const nearGuide = dilate(guide);
  let covered = 0;
  for (const g of guide) if (nearStroke.has(g)) covered++;
  let outside = 0;
  for (const s of stroke) if (!nearGuide.has(s)) outside++;
  const cover = covered / guide.size;
  const out = outside / stroke.size;
  return { cover, outside: out, ok: cover >= MIN_COVER && out <= MAX_OUTSIDE && stroke.size >= 3 };
}

export function TracingPad({ glyph, lang = "bn", font = "bangla", onSuccess, onSelfReport }: {
  glyph: string;
  lang?: "bn" | "en";
  /** Which page font to draw the letter with. */
  font?: "bangla" | "display";
  onSuccess: () => void;
  onSelfReport?: () => void;
}) {
  const t = TEXT[lang];
  const wrapRef = useRef<HTMLDivElement>(null);
  const guideRef = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef<HTMLCanvasElement>(null);
  const guideCells = useRef<Set<number>>(new Set());
  const strokeCells = useRef<Set<number>>(new Set());
  const last = useRef<Pt | null>(null);
  const [msg, setMsg] = useState<{ text: string; good: boolean } | null>(null);

  /** Draws the faint guide letter and works out which grid cells it covers. Never touches the child's strokes. */
  const drawGuide = useCallback(() => {
    const wrap = wrapRef.current, gc = guideRef.current;
    if (!wrap || !gc) return;
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    gc.width = SIZE * dpr; gc.height = SIZE * dpr;
    const family = getComputedStyle(wrap).fontFamily || "sans-serif";
    const g = gc.getContext("2d");
    if (!g) return;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, SIZE, SIZE);
    let px = 210;
    g.font = `600 ${px}px ${family}`;
    const w = g.measureText(glyph).width;
    if (w > SIZE * 0.82) { px = Math.floor((px * SIZE * 0.82) / w); g.font = `600 ${px}px ${family}`; }
    g.textAlign = "center";
    g.textBaseline = "middle";
    // Midline guide.
    g.strokeStyle = cssColor(wrap, "--line", 0.9, "#ddd");
    g.setLineDash([6, 8]);
    g.lineWidth = 2;
    g.beginPath(); g.moveTo(10, SIZE / 2); g.lineTo(SIZE - 10, SIZE / 2); g.stroke();
    g.setLineDash([]);
    g.fillStyle = cssColor(wrap, "--muted", 0.28, "rgba(120,120,140,.28)");
    g.fillText(glyph, SIZE / 2, SIZE / 2 + px * 0.04);

    // Guide cells from an unscaled offscreen copy.
    const off = document.createElement("canvas");
    off.width = SIZE; off.height = SIZE;
    const o = off.getContext("2d", { willReadFrequently: true });
    const cells = new Set<number>();
    if (o) {
      o.font = `600 ${px}px ${family}`;
      o.textAlign = "center";
      o.textBaseline = "middle";
      o.fillStyle = "#000";
      o.fillText(glyph, SIZE / 2, SIZE / 2 + px * 0.04);
      const data = o.getImageData(0, 0, SIZE, SIZE).data;
      for (let cy = 0; cy < GRID; cy++) for (let cx = 0; cx < GRID; cx++) {
        let ink = 0;
        for (let y = cy * CELL; y < (cy + 1) * CELL; y += 2) for (let x = cx * CELL; x < (cx + 1) * CELL; x += 2) {
          if (data[(y * SIZE + x) * 4 + 3] > 100) ink++;
        }
        if (ink >= 4) cells.add(cy * GRID + cx);
      }
    }
    guideCells.current = cells;
  }, [glyph]);

  /** Empties the drawing layer (new letter or "clear"). */
  const resetDrawing = useCallback(() => {
    const dc = drawRef.current;
    if (!dc) return;
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    dc.width = SIZE * dpr; dc.height = SIZE * dpr; // resizing also clears it
    dc.getContext("2d")?.setTransform(dpr, 0, 0, dpr, 0, 0);
    strokeCells.current = new Set();
    last.current = null;
    setMsg(null);
  }, []);

  useEffect(() => {
    resetDrawing();
    drawGuide();
    let alive = true;
    // When web fonts finish loading, redraw only the guide so the real letter
    // shape is used — strokes the child has already drawn are kept.
    document.fonts?.ready.then(() => { if (alive) drawGuide(); }).catch(() => {});
    return () => { alive = false; };
  }, [drawGuide, resetDrawing]);

  function point(e: RPointerEvent<HTMLCanvasElement>): Pt {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * SIZE, y: ((e.clientY - r.top) / r.height) * SIZE };
  }

  function mark(p: Pt) {
    const cx = Math.floor(p.x / CELL), cy = Math.floor(p.y / CELL);
    if (cx >= 0 && cy >= 0 && cx < GRID && cy < GRID) strokeCells.current.add(cy * GRID + cx);
  }

  function line(a: Pt, b: Pt) {
    const d = drawRef.current?.getContext("2d");
    const wrap = wrapRef.current;
    if (!d || !wrap) return;
    d.strokeStyle = cssColor(wrap, "--math", 1, "#3b82f6");
    d.lineWidth = 16;
    d.lineCap = "round";
    d.lineJoin = "round";
    d.beginPath(); d.moveTo(a.x, a.y); d.lineTo(b.x, b.y); d.stroke();
    const steps = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 4));
    for (let i = 0; i <= steps; i++) mark({ x: a.x + ((b.x - a.x) * i) / steps, y: a.y + ((b.y - a.y) * i) / steps });
  }

  function down(e: RPointerEvent<HTMLCanvasElement>) {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = point(e);
    last.current = p;
    line(p, p);
    setMsg(null);
  }
  function move(e: RPointerEvent<HTMLCanvasElement>) {
    if (!last.current) return;
    const p = point(e);
    line(last.current, p);
    last.current = p;
  }
  function up() { last.current = null; }

  function clear() { resetDrawing(); }

  function check() {
    if (!strokeCells.current.size) { setMsg({ text: t.empty, good: false }); return; }
    const s = scoreTrace(guideCells.current, strokeCells.current);
    if (s.ok) { setMsg({ text: t.good, good: true }); onSuccess(); return; }
    setMsg({ text: s.outside > MAX_OUTSIDE ? t.off : t.more, good: false });
  }

  return (
    <div className="grid justify-items-center gap-3">
      <div ref={wrapRef} className={`relative aspect-square w-full max-w-[320px] overflow-hidden rounded-3xl border-[3px] border-line bg-surface ${font === "bangla" ? "font-bangla" : "font-display"}`}>
        <canvas ref={guideRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />
        <canvas ref={drawRef} role="img" aria-label={t.canvas(glyph)}
          className="absolute inset-0 h-full w-full cursor-crosshair touch-none"
          onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onLostPointerCapture={up} />
      </div>
      <p className="text-center text-sm font-bold text-muted">{t.hint}</p>
      <div className="grid w-full max-w-[320px] grid-cols-2 gap-2">
        <button type="button" className="btn-primary" onClick={check}>{t.check}</button>
        <button type="button" className="btn-secondary" onClick={clear}>{t.clear}</button>
        {onSelfReport && <button type="button" className="btn-ghost btn-sm col-span-2" onClick={onSelfReport}>{t.paper}</button>}
      </div>
      <p role="status" aria-live="polite" className={`min-h-[1.75rem] text-center font-bold ${msg?.good ? "text-good" : "text-ink"}`}>{msg?.text ?? ""}</p>
    </div>
  );
}
