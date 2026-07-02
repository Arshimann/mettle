import { useId, useState } from 'react';

export interface ChartPoint {
  value: number;
  /** Optional context shown in the tap tooltip (a date, "2 wk ago", …). */
  label?: string;
}

/** Minimal responsive SVG area+line chart. Expects 2+ points.
 *  Dots are tappable: a tap shows a value/label tooltip, tapping again
 *  (or anywhere else on the chart) dismisses it. */
export function LineChart({
  data,
  format,
}: {
  data: ChartPoint[];
  /** Formats the tooltip value (units, rounding). Defaults to toLocaleString. */
  format?: (v: number) => string;
}) {
  const gid = useId();
  const [sel, setSel] = useState<number | null>(null);
  if (data.length < 2) return null;

  const w = 320;
  const h = 130;
  const pad = 12;
  const ys = data.map((d) => d.value);
  const min = Math.min(...ys);
  const max = Math.max(...ys);
  const range = max - min || 1;
  const pts = data.map((d, i) => ({
    x: pad + (i / (data.length - 1)) * (w - 2 * pad),
    y: h - pad - ((d.value - min) / range) * (h - 2 * pad),
  }));
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const area = `${line} L${pts[pts.length - 1].x.toFixed(1)} ${h - pad} L${pts[0].x.toFixed(1)} ${h - pad} Z`;

  const fmt = format ?? ((v: number) => v.toLocaleString());
  const tip = sel != null ? { p: pts[sel], d: data[sel] } : null;
  // Clamp the tooltip inside the viewBox and flip below the dot when cramped.
  const TIP_W = 92;
  const tipX = tip ? Math.min(Math.max(tip.p.x - TIP_W / 2, 2), w - TIP_W - 2) : 0;
  const tipAbove = tip ? tip.p.y > 44 : true;
  const tipY = tip ? (tipAbove ? tip.p.y - 42 : tip.p.y + 10) : 0;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="w-full h-auto block"
      onClick={() => setSel(null)}
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.22" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {tip && (
        <line x1={tip.p.x} y1={tip.p.y} x2={tip.p.x} y2={h - pad} stroke="var(--border-strong)" strokeWidth="1" strokeDasharray="3 3" />
      )}
      {pts.map((p, i) => (
        <g key={i}>
          <circle
            cx={p.x}
            cy={p.y}
            r={sel === i ? 5 : i === pts.length - 1 ? 3.5 : 2.5}
            fill="var(--accent)"
            stroke={sel === i ? 'var(--canvas)' : 'none'}
            strokeWidth={sel === i ? 2 : 0}
          />
          {/* generous invisible hit target for fingers */}
          <circle
            cx={p.x}
            cy={p.y}
            r={13}
            fill="transparent"
            style={{ cursor: 'pointer' }}
            onClick={(e) => {
              e.stopPropagation();
              setSel(sel === i ? null : i);
            }}
          />
        </g>
      ))}
      {tip && (
        <g pointerEvents="none">
          <rect x={tipX} y={tipY} width={TIP_W} height={32} rx={8} fill="var(--fg)" opacity="0.92" />
          <text
            x={tipX + TIP_W / 2}
            y={tipY + (tip.d.label ? 14 : 20)}
            textAnchor="middle"
            fontSize="11"
            fontWeight="700"
            fill="var(--canvas)"
          >
            {fmt(tip.d.value)}
          </text>
          {tip.d.label && (
            <text x={tipX + TIP_W / 2} y={tipY + 26} textAnchor="middle" fontSize="9" fill="var(--canvas)" opacity="0.75">
              {tip.d.label}
            </text>
          )}
        </g>
      )}
    </svg>
  );
}
