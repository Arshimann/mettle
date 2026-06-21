import { Activity, Dumbbell, Flame, Layers, type LucideIcon } from 'lucide-react';
import type { TabToggles, TrainingStyle } from '../types';

export interface StyleDef {
  id: TrainingStyle;
  label: string;
  blurb: string;
  icon: LucideIcon;
  /** Template id (from data/templates) to pre-select in onboarding. */
  recommendedTemplate: string;
  /** Default optional-tab visibility for this style (Home/Train/You always on). */
  tabs: TabToggles;
  /** Default rest between sets, in seconds. */
  preferredRest: number;
}

export const STYLE_DEFS: Record<TrainingStyle, StyleDef> = {
  bodybuilding: {
    id: 'bodybuilding',
    label: 'Bodybuilding',
    blurb: 'Build muscle and size with higher-volume training.',
    icon: Dumbbell,
    recommendedTemplate: 'ppl',
    tabs: { split: true, stretch: false, recovery: false, progress: true, learn: true },
    preferredRest: 90,
  },
  strength: {
    id: 'strength',
    label: 'Pure strength',
    blurb: 'Get as strong as possible on the big lifts. Heavy, low reps, long rest.',
    icon: Flame,
    recommendedTemplate: 'upper-lower',
    tabs: { split: true, stretch: false, recovery: false, progress: true, learn: true },
    preferredRest: 180,
  },
  crossfit: {
    id: 'crossfit',
    label: 'CrossFit',
    blurb: 'Varied, fast-paced conditioning. Mobility matters here.',
    icon: Activity,
    recommendedTemplate: 'full-body',
    tabs: { split: true, stretch: true, recovery: true, progress: true, learn: false },
    preferredRest: 60,
  },
  all: {
    id: 'all',
    label: 'All of it',
    blurb: 'A bit of everything — strength, size, and conditioning.',
    icon: Layers,
    recommendedTemplate: 'full-body',
    tabs: { split: true, stretch: true, recovery: false, progress: true, learn: true },
    preferredRest: 120,
  },
};

export const STYLE_LIST: StyleDef[] = [
  STYLE_DEFS.bodybuilding,
  STYLE_DEFS.strength,
  STYLE_DEFS.crossfit,
  STYLE_DEFS.all,
];

/** A short quiz whose answers each lean toward a style; the mode wins (ties → 'all'). */
export interface QuizQuestion {
  q: string;
  options: { label: string; style: TrainingStyle }[];
}

export const QUIZ: QuizQuestion[] = [
  {
    q: "What's your main goal?",
    options: [
      { label: 'Build muscle & size', style: 'bodybuilding' },
      { label: 'Get as strong as possible', style: 'strength' },
      { label: 'Overall fitness & conditioning', style: 'crossfit' },
      { label: 'A bit of everything', style: 'all' },
    ],
  },
  {
    q: 'How do you like to train?',
    options: [
      { label: 'Higher reps, lots of volume', style: 'bodybuilding' },
      { label: 'Heavy weight, low reps', style: 'strength' },
      { label: 'Varied and fast-paced', style: 'crossfit' },
      { label: 'I mix it up', style: 'all' },
    ],
  },
  {
    q: 'How much do you care about mobility & stretching?',
    options: [
      { label: "A lot — it's part of my routine", style: 'crossfit' },
      { label: 'Somewhat', style: 'all' },
      { label: 'I focus on the lifts', style: 'bodybuilding' },
      { label: 'Barely think about it', style: 'strength' },
    ],
  },
];

/** Tally selected styles; most-picked wins, ties resolve to 'all'. */
export function inferStyle(picks: TrainingStyle[]): TrainingStyle {
  const counts: Record<TrainingStyle, number> = { crossfit: 0, bodybuilding: 0, strength: 0, all: 0 };
  picks.forEach((p) => (counts[p] += 1));
  let best: TrainingStyle = 'all';
  let bestN = -1;
  let tie = false;
  (Object.keys(counts) as TrainingStyle[]).forEach((k) => {
    if (counts[k] > bestN) {
      bestN = counts[k];
      best = k;
      tie = false;
    } else if (counts[k] === bestN) {
      tie = true;
    }
  });
  return tie ? 'all' : best;
}
