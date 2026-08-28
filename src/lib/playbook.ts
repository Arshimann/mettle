import type { PlaybookProgress } from '../types';
import { normalizeForSpeech, SPEECH_PAUSE } from './speechText';
import {
  ALL_ARTICLES,
  PLAYBOOK,
  type PlaybookArticle,
  type PlaybookSection,
} from '../data/playbook';

export interface LevelProgress {
  level: number;
  title: string;
  read: number;
  total: number;
  locked: boolean;
}

export interface SectionProgress {
  unlockedLevel: number;
  readCount: number;
  totalCount: number;
  levels: LevelProgress[];
}

/**
 * Levels unlock by reading, not by workouts logged: level 2 assumes the
 * vocabulary level 1 builds, and gating good material behind training volume
 * would hide it from exactly the beginner who needs it. A per-section skip
 * exists so an experienced lifter isn't walled out of the deep material.
 */
export function sectionProgress(section: PlaybookSection, p: PlaybookProgress): SectionProgress {
  const skipped = p.unlocked[section.id] ?? 1;
  let unlockedLevel = 1;
  let consecutive = true;

  const levels: LevelProgress[] = section.levels.map((lvl) => {
    const read = lvl.articles.filter((a) => p.read[a.id]).length;
    const complete = read === lvl.articles.length;
    const locked = lvl.level > Math.max(unlockedLevel, skipped);
    if (consecutive && complete) unlockedLevel = lvl.level + 1;
    else consecutive = false;
    return { level: lvl.level, title: lvl.title, read, total: lvl.articles.length, locked };
  });

  // Recompute lock state now that unlockedLevel is final.
  const ceiling = Math.max(unlockedLevel, skipped);
  levels.forEach((l) => {
    l.locked = l.level > ceiling;
  });

  const all = section.levels.flatMap((l) => l.articles);
  return {
    unlockedLevel: ceiling,
    readCount: all.filter((a) => p.read[a.id]).length,
    totalCount: all.length,
    levels,
  };
}

/** The next unread, unlocked article — powers the Continue card. */
export function nextUpArticle(p: PlaybookProgress): PlaybookArticle | null {
  for (const section of PLAYBOOK) {
    const prog = sectionProgress(section, p);
    for (const lvl of section.levels) {
      if (lvl.level > prog.unlockedLevel) continue;
      const next = lvl.articles.find((a) => !p.read[a.id]);
      if (next) return next;
    }
  }
  return null;
}

export function totalRead(p: PlaybookProgress): { read: number; total: number } {
  return { read: Object.keys(p.read).length, total: ALL_ARTICLES.length };
}

/**
 * Flatten an article into speakable prose — headings, body, then takeaways.
 *
 * Everything goes through normalizeForSpeech, which is what turns "1RM" into
 * "one-rep max", "8–12" into "8 to 12" and "1.6 g/kg" into "1.6 grams per
 * kilogram". Without it the synthesiser spells the notation out letter by
 * letter, which is most of what makes stock TTS sound robotic on this content.
 */
export function articleToSpeech(a: PlaybookArticle): string {
  const parts: string[] = [a.title];
  for (const b of a.blocks) {
    if (b.kind === 'list' && b.items) parts.push(b.items.join('. '));
    else if (b.text) parts.push(b.text);
  }
  if (a.takeaways.length) parts.push('Key takeaways.', a.takeaways.join('. '));
  return normalizeForSpeech(parts.join(SPEECH_PAUSE));
}
