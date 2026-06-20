import type { Units } from '../types';

const LB_PER_KG = 2.20462;

export function parseNum(v: string | number | null | undefined): number {
  if (v === '' || v === null || v === undefined) return NaN;
  return parseFloat(String(v).replace(',', '.'));
}

export function unitLabel(units: Units): string {
  return units === 'lbs' ? 'lb' : 'kg';
}

/** Convert a display-unit value to canonical kg. */
export function toKg(displayWeight: string | number, units: Units): number {
  const n = parseNum(displayWeight);
  if (isNaN(n)) return 0;
  return units === 'lbs' ? Math.round((n / LB_PER_KG) * 100) / 100 : n;
}

/** Convert canonical kg to a display-unit number. */
export function fromKg(kg: number, units: Units): number {
  if (kg === null || kg === undefined || isNaN(kg)) return 0;
  return units === 'lbs' ? Math.round(kg * LB_PER_KG * 10) / 10 : Math.round(kg * 10) / 10;
}

/** Display weight as a clean string (drops trailing .0). */
export function fmtWeight(kg: number, units: Units): string {
  const v = fromKg(kg, units);
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
}

/** Smallest sensible plate increment in the active unit. */
export function loadIncrement(units: Units): number {
  return units === 'lbs' ? 5 : 2.5;
}
