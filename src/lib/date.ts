/** Local YYYY-MM-DD (avoids UTC off-by-one near midnight). */
export function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayStr(d: Date = new Date()): string {
  return toISO(d);
}

/** Parse a YYYY-MM-DD anchored at local noon (safe for day math). */
export function fromISO(iso: string): Date {
  return new Date(iso + 'T12:00:00');
}

export function addDays(d: Date, n: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + n);
  return out;
}

export function daysBetween(aISO: string, bISO: string): number {
  return Math.round((fromISO(bISO).getTime() - fromISO(aISO).getTime()) / 86400000);
}

/** Monday of the week containing `iso`. Weeks run Mon–Sun throughout the app. */
export function startOfWeek(iso: string): string {
  const d = fromISO(iso);
  // getDay() is 0=Sun…6=Sat; shift so Monday is 0.
  return toISO(addDays(d, -((d.getDay() + 6) % 7)));
}

/** Whole Mon–Sun weeks from a's week to b's week (negative if b is earlier). */
export function weeksBetween(aISO: string, bISO: string): number {
  return Math.round(daysBetween(startOfWeek(aISO), startOfWeek(bISO)) / 7);
}

/** Distinct calendar days trained inside the Mon–Sun week containing `iso`. */
export function daysTrainedInWeek(dates: string[], iso: string = todayStr()): number {
  const monday = startOfWeek(iso);
  const sunday = toISO(addDays(fromISO(monday), 6));
  return new Set(dates.filter((d) => d >= monday && d <= sunday)).size;
}

export function prettyDate(iso: string): string {
  const d = fromISO(iso);
  const today = todayStr();
  const yesterday = toISO(addDays(new Date(), -1));
  if (iso === today) return 'Today';
  if (iso === yesterday) return 'Yesterday';
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

export function shortDate(iso: string): string {
  return fromISO(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function fmtDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${String(s).padStart(2, '0')}s`;
}
