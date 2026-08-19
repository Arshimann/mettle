/**
 * Prepares Playbook prose for a speech synthesiser.
 *
 * This is where most of the perceived quality comes from. The raw text is full
 * of things TTS engines mangle — "1RM" gets spelled out letter by letter,
 * "8–12" becomes "eight dash twelve", "1.6 g/kg" turns into gibberish, and
 * "e.g." is read as two letters. Fixing the input matters far more than
 * fiddling with rate and pitch.
 */

/** Ordered — longer/more specific patterns first so they win. */
const REPLACEMENTS: [RegExp, string][] = [
  // --- training jargon ---
  [/\be1RM\b/gi, 'estimated one-rep max'],
  [/\b1RM\b/gi, 'one-rep max'],
  [/\bRIR\b/g, 'reps in reserve'],
  [/\bRPE\b/g, 'R P E'],
  [/\bDOMS\b/g, 'domms'],
  [/\bTDEE\b/g, 'T D E E'],
  [/\bBMR\b/g, 'B M R'],
  [/\bROM\b/g, 'range of motion'],
  [/\bMEV\b/g, 'M E V'],
  [/\bMRV\b/g, 'M R V'],

  // --- units ---
  [/(\d)\s*g\/kg\b/g, '$1 grams per kilogram'],
  [/\bg\/kg\b/g, 'grams per kilogram'],
  [/(\d)\s*kg\b/g, '$1 kilograms'],
  [/(\d)\s*lbs?\b/g, '$1 pounds'],
  [/(\d)\s*km\b/g, '$1 kilometres'],
  [/(\d)\s*%/g, '$1 percent'],
  [/(\d)\s*kcal\b/gi, '$1 calories'],
  [/\bhrs?\b/g, 'hours'],

  // --- ranges and symbols ---
  // En/em dashes between numbers are ranges, not pauses: "8–12" → "8 to 12".
  [/(\d)\s*[–—-]\s*(\d)/g, '$1 to $2'],
  [/(\d)\s*[×x]\s*(\d)/g, '$1 by $2'],
  [/\s*[–—]\s*/g, ', '], // a dash used as punctuation becomes a real pause
  [/~(\d)/g, 'around $1'],
  [/\b(\d+)\s*\+\s*/g, '$1 plus '],
  [/&/g, ' and '],

  // --- latin abbreviations, which get spelled out otherwise ---
  [/\be\.g\.\s*/gi, 'for example, '],
  [/\bi\.e\.\s*/gi, 'that is, '],
  [/\bvs\.?\b/gi, 'versus'],
  [/\betc\.\s*/gi, 'and so on. '],

  // --- typography ---
  [/[""]/g, '"'],
  [/['']/g, "'"],
  [/…/g, '. '],
];

/**
 * A short pause after headings and before list items makes long-form audio
 * far easier to follow. Synthesisers honour sentence punctuation, so the
 * simplest reliable pause is a full stop plus whitespace.
 */
export function normalizeForSpeech(text: string): string {
  let out = text;
  for (const [pattern, replacement] of REPLACEMENTS) out = out.replace(pattern, replacement);
  return out
    // Collapse whitespace, but keep sentence breaks intact.
    .replace(/\s+/g, ' ')
    // Avoid doubled punctuation created by the substitutions above.
    .replace(/\s*,\s*,/g, ',')
    .replace(/\.\s*\./g, '.')
    .trim();
}

/** Marks a deliberate pause between blocks when assembling an article. */
export const SPEECH_PAUSE = ' … ';
