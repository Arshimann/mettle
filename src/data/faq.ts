import type { ScreenId } from '../store/useUI';

/**
 * The questions this app actually generates, each ending somewhere you can act.
 *
 * A FAQ that only explains is a wall of text you scroll past. The `go` link is
 * the point: every answer that has a fix hands you the exact screen holding it,
 * through the same navigate(screen, params) the rest of the app uses.
 */
export interface FaqEntry {
  id: string;
  q: string;
  a: string;
  /** Searched alongside the question, so "backup" finds the export answer. */
  keywords?: string[];
  go?: { label: string; screen: ScreenId; params?: Record<string, unknown> };
}

export const FAQ: FaqEntry[] = [
  {
    id: 'backup',
    q: 'How do I back up my data?',
    a: 'Everything lives on this device by default. Settings → Data exports the lot as a single file you can keep anywhere. Signing in also backs it up to the cloud automatically after every change.',
    keywords: ['backup', 'export', 'save', 'lose', 'data'],
    go: { label: 'Open Data', screen: 'settings', params: { section: 'data' } },
  },
  {
    id: 'new-phone',
    q: 'How do I move to a new phone?',
    a: 'Export a file from Settings → Data on the old phone, then Import it on the new one. If you have an account, just sign in instead and it syncs itself.',
    keywords: ['transfer', 'move', 'device', 'import', 'migrate'],
    go: { label: 'Open Data', screen: 'settings', params: { section: 'data' } },
  },
  {
    id: 'streak',
    q: 'Why didn’t my streak go up?',
    a: 'Streaks count trained days, not calendar days, and every Mon–Sun week gives you two rest days for free. Rest days keep the streak alive without adding to it — miss more than two in a week and it breaks.',
    keywords: ['streak', 'flame', 'rest', 'freeze', 'broken'],
    go: { label: 'See your consistency', screen: 'you' },
  },
  {
    id: 'add-friend',
    q: 'How do I add a friend?',
    a: 'Both of you need an account. Share the six-character code on the Friends tab, or type theirs in with Add. Once one of you accepts you’ll see each other’s training.',
    keywords: ['friend', 'code', 'add', 'invite', 'social'],
    go: { label: 'Open Friends', screen: 'friends' },
  },
  {
    id: 'who-sees',
    q: 'Who can see my workouts?',
    a: 'Only people you’ve accepted as friends, and only if sharing is on. Your name, streak and consistency calendar are always visible to friends; workouts, PRs and your split each have their own switch.',
    keywords: ['privacy', 'private', 'share', 'visible', 'who'],
    go: { label: 'Friends & privacy', screen: 'settings', params: { section: 'social' } },
  },
  {
    id: 'photos-private',
    q: 'Are my progress photos private?',
    a: 'Yes. Every check-in is private the moment you take it and stays that way unless you deliberately post it to the friends board. You can pull them all back to private at once in Settings.',
    keywords: ['photo', 'physique', 'check-in', 'private', 'body'],
    go: { label: 'Open You', screen: 'you' },
  },
  {
    id: 'change-split',
    q: 'How do I change my split?',
    a: 'The Split tab. Add or rename days, drag to reorder, and tap any exercise to set its target sets and reps. Templates gives you proven splits to start from.',
    keywords: ['split', 'program', 'routine', 'days', 'plan'],
    go: { label: 'Open Split', screen: 'split' },
  },
  {
    id: 'custom-exercise',
    q: 'How do I add an exercise that isn’t listed?',
    a: 'Start typing its name in any exercise picker. If nothing matches you’ll get an “Add …” button — pick a muscle group and it’s saved to your library for good, marked with a star.',
    keywords: ['custom', 'exercise', 'missing', 'new', 'movement'],
    go: { label: 'Open Train', screen: 'train' },
  },
  {
    id: 'swap-exercise',
    q: 'Can I swap an exercise mid-workout?',
    a: 'Yes — the two-arrow button on any exercise card. It keeps the sets you’ve already logged and leads with movements that train the same thing, so the swap doesn’t cost you the work.',
    keywords: ['swap', 'replace', 'change', 'substitute', 'busy'],
    go: { label: 'Open Train', screen: 'train' },
  },
  {
    id: 'f-button',
    q: 'What does the F button do?',
    a: 'It marks a set as taken to failure. Failure sets keep exactly the reps you type rather than accepting the suggested number, because the whole point is that you don’t know the count in advance.',
    keywords: ['f', 'failure', 'amrap', 'button'],
  },
  {
    id: 'suggested-weight',
    q: 'Where does the suggested weight come from?',
    a: 'Your last performance on that exact movement, plus a small increment if it went well. It is a starting point, not an instruction — tap it to accept, or type straight over it.',
    keywords: ['suggestion', 'weight', 'try', 'placeholder', 'progression'],
  },
  {
    id: 'cardio',
    q: 'How do I log cardio?',
    a: 'Anything in the Cardio group logs minutes and distance instead of weight and reps, and works out your pace. Cardio never sets a lifting PR, so it gets its own record: your longest bout and best pace.',
    keywords: ['cardio', 'run', 'treadmill', 'distance', 'pace', 'minutes'],
    go: { label: 'Open Train', screen: 'train' },
  },
  {
    id: 'sounds',
    q: 'How do I turn off the sounds or vibration?',
    a: 'Settings → Feel. Sound effects and haptics have separate switches, and the rest-timer chime has its own on top of those.',
    keywords: ['sound', 'mute', 'silent', 'haptics', 'vibration', 'noise'],
    go: { label: 'Open Feel', screen: 'settings', params: { section: 'feel' } },
  },
  {
    id: 'install',
    q: 'How do I put it on my home screen?',
    a: 'Mettle installs straight from the browser — no app store. Settings → About has the exact steps for your phone. Installed, it runs full screen and works offline.',
    keywords: ['install', 'home screen', 'app', 'pwa', 'offline'],
    go: { label: 'Open About', screen: 'settings', params: { section: 'about' } },
  },
  {
    id: 'forgot-password',
    q: 'I forgot my password.',
    a: 'Your password is stored as a one-way hash, so nobody — including Mettle — can read it back to you. The Account card on the You tab can set a new one, or email you a reset link.',
    keywords: ['password', 'forgot', 'reset', 'locked out', 'login', 'email'],
    go: { label: 'Open You', screen: 'you' },
  },
  {
    id: 'hide-tabs',
    q: 'Can I hide tabs I do not use?',
    a: 'Settings → Appearance. Home, Train and You always stay; everything else can be switched off and the bottom bar gets roomier for it.',
    keywords: ['tabs', 'hide', 'nav', 'clutter', 'simplify'],
    go: { label: 'Open Appearance', screen: 'settings', params: { section: 'appearance' } },
  },
  {
    id: 'theme',
    q: 'How do I change the colours?',
    a: 'Settings → Appearance has the themes and an accent colour that recolours everything, right down to the streak flame. You can switch the display font there too.',
    keywords: ['theme', 'colour', 'color', 'dark', 'light', 'accent', 'font'],
    go: { label: 'Open Appearance', screen: 'settings', params: { section: 'appearance' } },
  },
  {
    id: 'playbook',
    q: 'What is the Playbook?',
    a: 'A short, evidence-led course on training — volume, intensity, progression, recovery. It unlocks in levels as you read, and you can skip ahead if you already know the basics.',
    keywords: ['playbook', 'learn', 'read', 'course', 'education'],
    go: { label: 'Open Learn', screen: 'learn' },
  },
  {
    id: 'injury',
    q: 'Can it work around an injury?',
    a: 'Tell it which areas to be careful with in Settings → You, and the exercise picker flags the movements that load those joints hardest and offers gentler alternatives training the same muscle. It is training-load guidance, not medical advice.',
    keywords: ['injury', 'pain', 'shoulder', 'knee', 'back', 'hurt', 'avoid'],
    go: { label: 'Open profile', screen: 'settings', params: { section: 'profile' } },
  },
  {
    id: 'delete-data',
    q: 'How do I wipe everything and start over?',
    a: 'Settings → Data → Reset all data. It clears your history, split, PRs and photos but keeps your settings and profile. It asks twice, and it cannot be undone.',
    keywords: ['delete', 'reset', 'wipe', 'clear', 'start over'],
    go: { label: 'Open Data', screen: 'settings', params: { section: 'data' } },
  },
];
