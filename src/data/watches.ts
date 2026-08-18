/**
 * A hand-picked training video per day. Deliberately curated rather than
 * pulled from an API: no key to ship, no quota, no algorithm deciding what a
 * lifter sees. Channels chosen for citing evidence rather than selling it.
 */
export interface Watch {
  title: string;
  creator: string;
  /** Why this one is worth twenty minutes. */
  why: string;
  /** A search query rather than a hard video id — links rot, topics don't. */
  query: string;
  minutes: number;
  topic: 'Technique' | 'Programming' | 'Nutrition' | 'Recovery' | 'Science';
}

export const WATCHES: Watch[] = [
  {
    title: 'How to squat properly',
    creator: 'Squat University',
    why: 'Depth, bracing and knee travel explained by a physio, without the dogma about what your knees may or may not do.',
    query: 'Squat University how to squat properly',
    minutes: 12,
    topic: 'Technique',
  },
  {
    title: 'How many sets per muscle per week',
    creator: 'Dr Mike Israetel',
    why: 'The clearest walkthrough of volume landmarks — the floor, the productive range, and the point where more stops helping.',
    query: 'Renaissance Periodization how many sets per muscle per week',
    minutes: 15,
    topic: 'Programming',
  },
  {
    title: 'Training to failure: what the research says',
    creator: 'Jeff Nippard',
    why: 'A fair read of the evidence on how close to failure you need to train, and where the cost outweighs the benefit.',
    query: 'Jeff Nippard training to failure science',
    minutes: 14,
    topic: 'Science',
  },
  {
    title: 'Fixing your bench press setup',
    creator: 'Alan Thrall',
    why: 'Arch, leg drive and shoulder position, taught plainly by someone who competes rather than poses.',
    query: 'Alan Thrall how to bench press',
    minutes: 11,
    topic: 'Technique',
  },
  {
    title: 'The science of muscle growth',
    creator: 'Dr Andy Galpin',
    why: 'What actually signals a muscle to grow, from a physiologist who researches it for a living.',
    query: 'Andy Galpin science of muscle growth',
    minutes: 20,
    topic: 'Science',
  },
  {
    title: 'How much protein do you really need',
    creator: 'Layne Norton',
    why: 'Cuts through the 1g-per-pound folklore with the actual dose–response data.',
    query: 'Layne Norton how much protein do you need',
    minutes: 13,
    topic: 'Nutrition',
  },
  {
    title: 'Deadlift setup, step by step',
    creator: 'Alan Thrall',
    why: 'The five-step setup that fixes most deadlift problems before the bar leaves the floor.',
    query: 'Alan Thrall how to deadlift',
    minutes: 10,
    topic: 'Technique',
  },
  {
    title: 'Sleep and athletic performance',
    creator: 'Dr Matthew Walker',
    why: 'Why the highest-leverage recovery tool is the one you are most likely to trade away.',
    query: 'Matthew Walker sleep and athletic performance',
    minutes: 18,
    topic: 'Recovery',
  },
  {
    title: 'Building bigger side delts',
    creator: 'Jeff Nippard',
    why: 'Directly useful if your pressing has quietly out-grown your lateral work — which it usually has.',
    query: 'Jeff Nippard side delt training science',
    minutes: 12,
    topic: 'Programming',
  },
  {
    title: 'Progressive overload, properly explained',
    creator: 'Renaissance Periodization',
    why: 'The many ways to add stimulus once adding weight every session stops working.',
    query: 'Renaissance Periodization progressive overload explained',
    minutes: 14,
    topic: 'Programming',
  },
  {
    title: 'Cutting without losing muscle',
    creator: 'Jeff Nippard',
    why: 'Deficit size, protein and training adjustments that decide whether you keep what you built.',
    query: 'Jeff Nippard how to cut without losing muscle',
    minutes: 16,
    topic: 'Nutrition',
  },
  {
    title: 'Lower back pain and lifting',
    creator: 'Squat University',
    why: 'What to do when your back complains, and how to tell an ache from a problem.',
    query: 'Squat University lower back pain lifting',
    minutes: 13,
    topic: 'Recovery',
  },
  {
    title: 'Rep ranges and hypertrophy',
    creator: 'Dr Mike Israetel',
    why: 'Why five to thirty reps all work, and why the middle of that range still dominates in practice.',
    query: 'Renaissance Periodization rep ranges hypertrophy',
    minutes: 12,
    topic: 'Science',
  },
  {
    title: 'Overhead press technique',
    creator: 'Jeff Nippard',
    why: 'Bar path, layback and grip width — the details that decide whether it feels like shoulders or lower back.',
    query: 'Jeff Nippard overhead press technique',
    minutes: 11,
    topic: 'Technique',
  },
];

/** Same pick all day, rotates tomorrow — matching the daily-fact idiom. */
export function watchOfTheDay(): Watch {
  return WATCHES[Math.floor(Date.now() / 86400000) % WATCHES.length];
}
