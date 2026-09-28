"use client";
import { useEffect, useRef, useState } from "react";

/** Draw at the container's real pixel width so text never scales up. */
function useWidth(fallback = 320) {
  const ref = useRef<HTMLElement>(null);
  const [w, setW] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setW(Math.max(240, Math.round(el.getBoundingClientRect().width)));
    update();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, w };
}

function niceCeil(max: number): number {
  if (max <= 5) return 5;
  if (max <= 10) return 10;
  return Math.ceil(max / 10) * 10;
}
import { STROKE_VAR, type Tone } from "./colors";

/**
 * Single-series charts (the title names the series, so no legend).
 * Thin marks, recessive grid, hover/focus tooltips; text uses ink tokens.
 */

export interface ColumnDatum { key: string; label: string; value: number; detail?: string; }

export function ColumnChart({ data, tone = "math", unit, title, height = 150 }: { data: ColumnDatum[]; tone?: Tone; unit: string; title: string; height?: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const { ref, w: W } = useWidth();
  const max = Math.max(1, ...data.map((d) => d.value));
  const niceMax = niceCeil(max);
  const H = height, padL = 28, padB = 22, padT = 10;
  const innerW = W - padL - 4, innerH = H - padB - padT;
  const bw = Math.max(8, Math.min(32, innerW / data.length - 10));
  const ticks = [0, niceMax / 2, niceMax];
  return (
    <figure className="relative" ref={ref as React.RefObject<HTMLElement>}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="block overflow-visible" role="img" aria-label={`${title}: ${data.map((d) => `${d.label} ${d.value} ${unit}`).join(", ")}`}>
        {ticks.map((t) => {
          const y = padT + innerH - (t / niceMax) * innerH;
          return (
            <g key={t}>
              <line x1={padL} x2={W} y1={y} y2={y} stroke="rgb(var(--line))" strokeWidth="1" strokeDasharray={t === 0 ? undefined : "3 4"} />
              <text x={padL - 6} y={y + 4} textAnchor="end" fontSize="11" fill="rgb(var(--muted))" className="tnum">{Math.round(t)}</text>
            </g>
          );
        })}
        {data.map((d, i) => {
          const x = padL + (i + 0.5) * (innerW / data.length) - bw / 2;
          const h = (d.value / niceMax) * innerH;
          const y = padT + innerH - h;
          const active = hover === i;
          return (
            <g key={d.key} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(i)} onBlur={() => setHover(null)} tabIndex={0} aria-label={`${d.label}: ${d.value} ${unit}`}>
              <rect x={x - 4} y={padT} width={bw + 8} height={innerH} fill="transparent" />
              {h > 0 && <path d={`M${x},${padT + innerH} V${y + 4} Q${x},${y} ${x + 4},${y} H${x + bw - 4} Q${x + bw},${y} ${x + bw},${y + 4} V${padT + innerH} Z`} fill={STROKE_VAR[tone]} opacity={hover === null || active ? 1 : 0.45} />}
              <text x={x + bw / 2} y={H - 6} textAnchor="middle" fontSize="11" fontWeight={active ? 800 : 600} fill={active ? "rgb(var(--ink))" : "rgb(var(--muted))"}>{d.label}</text>
            </g>
          );
        })}
      </svg>
      {hover !== null && (
        <div className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 -translate-y-full rounded-xl bg-ink px-3 py-1.5 text-center text-sm font-bold text-bg shadow-soft"
          style={{ left: `${((padL + (hover + 0.5) * (innerW / data.length)) / W) * 100}%` }}>
          <span className="tnum">{data[hover].value}</span> {unit}
          {data[hover].detail && <span className="block text-xs font-semibold opacity-80">{data[hover].detail}</span>}
        </div>
      )}
    </figure>
  );
}

export function TrendChart({ values, labels, tone = "math", title }: { values: (number | null)[]; labels: string[]; tone?: Tone; title: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const { ref, w: W } = useWidth();
  const H = 170, padL = 36, padR = 12, padT = 12, padB = 22;
  const innerW = W - padL - padR, innerH = H - padT - padB;
  const x = (i: number) => padL + (values.length === 1 ? innerW / 2 : (i / (values.length - 1)) * innerW);
  const y = (v: number) => padT + innerH - (v / 100) * innerH;
  // Break the line at missing days.
  const segments: string[] = [];
  let cur = "";
  values.forEach((v, i) => {
    if (v === null) { if (cur) segments.push(cur); cur = ""; return; }
    cur += `${cur ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`;
  });
  if (cur) segments.push(cur);
  const lastIdx = values.map((v, i) => (v === null ? -1 : i)).filter((i) => i >= 0).pop();
  const pts = values.map((v, i) => ({ v, i })).filter((p) => p.v !== null) as { v: number; i: number }[];

  return (
    <figure className="relative" ref={ref as React.RefObject<HTMLElement>}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="block overflow-visible" role="img" aria-label={`${title}. ${pts.length ? `Latest ${pts[pts.length - 1].v}%.` : "No scores yet."}`}
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
          const px = ((e.clientX - r.left) / r.width) * W;
          let best: number | null = null, bd = Infinity;
          for (const p of pts) { const d = Math.abs(x(p.i) - px); if (d < bd) { bd = d; best = p.i; } }
          setHover(best);
        }}>
        {[0, 50, 100].map((t) => (
          <g key={t}>
            <line x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} stroke="rgb(var(--line))" strokeDasharray={t ? "3 4" : undefined} />
            <text x={padL - 6} y={y(t) + 4} textAnchor="end" fontSize="10" fill="rgb(var(--muted))">{t}%</text>
          </g>
        ))}
        {labels.map((label, i) => {
          // Show every Nth label so they never collide; always show the last one.
          const every = Math.max(1, Math.ceil(labels.length / Math.max(2, Math.floor(innerW / 72))));
          const last = i === labels.length - 1;
          const show = last || (i % every === 0 && labels.length - 1 - i >= every);
          return show ? (
            <text key={i} x={x(i)} y={H - 6} textAnchor={last ? "end" : "middle"} fontSize="11" fill="rgb(var(--muted))">{label}</text>
          ) : null;
        })}
        {segments.map((d, i) => <path key={i} d={d} fill="none" stroke={STROKE_VAR[tone]} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />)}
        {pts.map((p) => (
          <circle key={p.i} cx={x(p.i)} cy={y(p.v)} r={p.i === lastIdx || p.i === hover ? 5.5 : 3.5} fill={STROKE_VAR[tone]} stroke="rgb(var(--surface))" strokeWidth="2" />
        ))}
        {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={padT} y2={padT + innerH} stroke="rgb(var(--muted))" strokeWidth="1" strokeDasharray="2 3" />}
      </svg>
      {hover !== null && values[hover] !== null && (
        <div className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 -translate-y-full rounded-xl bg-ink px-3 py-1.5 text-sm font-bold text-bg shadow-soft" style={{ left: `${(x(hover) / W) * 100}%` }}>
          {labels[hover]} · <span className="tnum">{values[hover]}%</span>
        </div>
      )}
    </figure>
  );
}
