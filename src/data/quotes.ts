export interface Quote {
  text: string;
  /** Attribution only where the line is genuinely theirs (public-domain
   *  stoics, film dialogue, or a figure's well-documented catchphrase).
   *  Original lines stay unattributed — no fake citations. */
  by?: string;
}

export const QUOTES: Quote[] = [
  // Aspiration (original)
  { text: 'The work you did today is already working.' },
  { text: 'Nobody sees the reps. Everybody sees the result.' },
  { text: 'You showed up. That was the hard part.' },
  { text: 'Strength is built on the days you almost stayed home.' },
  { text: 'Future you just said thanks.' },
  { text: 'One more brick on the wall. Keep laying them.' },
  { text: 'The iron never lies to you.' },
  { text: 'Consistency looks boring right up until it looks incredible.' },
  { text: 'You versus yesterday. You won.' },
  { text: 'Discipline is remembering what you want.' },
  { text: 'Rest now. The muscle is being built as you sit there.' },
  { text: 'Small daily wins compound into a different person.' },
  { text: 'The body keeps the receipts. Today was a deposit.' },
  // Stoics (public domain)
  { text: 'The impediment to action advances action. What stands in the way becomes the way.', by: 'Marcus Aurelius' },
  { text: 'You have power over your mind — not outside events. Realize this, and you will find strength.', by: 'Marcus Aurelius' },
  { text: 'Waste no more time arguing about what a good man should be. Be one.', by: 'Marcus Aurelius' },
  { text: 'Luck is what happens when preparation meets opportunity.', by: 'Seneca' },
  { text: 'Difficulties strengthen the mind, as labor does the body.', by: 'Seneca' },
  { text: 'No man is free who is not master of himself.', by: 'Epictetus' },
  { text: 'First say to yourself what you would be; and then do what you have to do.', by: 'Epictetus' },
  // Gym legends & co. — their documented catchphrases
  { text: "We're all gonna make it, brah.", by: 'Zyzz' },
  { text: "U mirin'?", by: 'Zyzz' },
  { text: 'How much ya bench?', by: 'Tren Twins' },
  { text: 'GET UP!', by: 'Tren Twins' },
  { text: 'Have a good rest of your day.', by: 'Sam Sulek' },
  { text: 'The only person you need to be better than is who you were yesterday.', by: 'Chris Bumstead' },
  { text: 'Nobody is coming to save you. Do the work, young king.', by: 'Hamza' },
  { text: "It's you versus you.", by: 'Togi' },
  { text: "I won't fail you. I'm not afraid.", by: 'Luke Skywalker' },
  // A few more originals so the cycle stays fresh
  { text: 'Heavy is a skill. You practiced it today.' },
  { text: 'The habit is the PR.' },
  { text: 'Leave the gym better than you entered it. Done.' },
];

/** Deterministic pick by workout count — every finish advances the quote,
 *  so two consecutive finishes never repeat. */
export function quoteForCount(n: number): Quote {
  return QUOTES[Math.abs(n) % QUOTES.length];
}
