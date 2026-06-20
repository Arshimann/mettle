import { useId } from 'react';

/** Minimal responsive SVG area+line chart. Expects 2+ points. */
export function LineChart({ data }: { data: { value: number }[] }) {
  const gid = useId();
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

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto block">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.22" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={i === pts.length - 1 ? 3.5 : 2.5} fill="var(--accent)" />
      ))}
    </svg>
  );
}
