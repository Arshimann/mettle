# Mettle v1.3 — "Living App" Implementation Brief

> **Read this whole document before you touch a single file.** It is long on
> purpose. Every section exists because a generic implementation of the same
> feature would come out wrong for *this* codebase. The cost of reading it is
> twenty minutes; the cost of skipping it is a rewrite.

---

## Part 0 — Mission & operating rules

### 0.1 What you are working on

**Mettle** is a phone-first lifting-tracker PWA. It lives at `C:\Users\itssu\mettle`.
Stack:

| Thing | Version / choice |
| --- | --- |
| Framework | React 19.2 |
| Bundler | Vite 8 |
| Language | TypeScript 6 (strict) |
| Styling | Tailwind CSS v4 via `@tailwindcss/vite` — **no `tailwind.config.js`**, tokens are declared in `src/index.css` under `@theme inline` |
| State | Zustand 5 — one persisted store, three ephemeral |
| Motion | framer-motion 12 |
| Icons | lucide-react |
| Backend | Supabase (auth, Postgres, storage, realtime presence) — **optional**; the app is fully functional offline with no Supabase project wired up |
| Packaging | vite-plugin-pwa (installable, offline, service worker) |
| Drag and drop | @dnd-kit |
| Current version | `1.2.1` (see `package.json`) |

Commands:

```bash
npm run dev
```

```bash
npm run build
```

```bash
npm run lint
```

`npm run build` is `tsc -b && vite build` — **the type-check is part of the build.**
A build that fails to type-check is a broken build, not a warning. There is a
preview launch config at `.claude/launch.json` (name `mettle-dev`, port 5173).

### 0.2 Your mission

Ship **v1.3.0**. That means eighteen user-requested changes, plus two shared
foundations they depend on — twenty numbered items in all, described in Part 3 and
executed to the standard of the code already in the repo. Some are one-line fixes.
Two of them (the tutorial engine and the injury system) are genuinely new
subsystems. One of them (the paper-airplane send) is the emotional centrepiece of
the release and deserves disproportionate care.

The user's own words for the goal were "give it life" and "make my app 100x cooler
than it already is." Take that seriously but read it correctly: it does not mean
*add more stuff and more animation everywhere*. This app's existing character is
**calm, precise, and occasionally cinematic** — long slow ambient glows, one
fanfare at the moment that earns it, silence everywhere else. There is a comment
in `src/lib/sound.ts` that says it outright:

> Navigation chrome (the settings cog, menu rows, segmented switches) is
> deliberately silent — a blip on every incidental tap got repetitive fast.
> Sound is reserved for the moments below, which mean something.

"Give it life" means **the moments that already matter should land harder**, and
**the friction that currently exists should disappear**. It does not mean confetti
on a settings toggle.

### 0.3 Hard rules

1. **No new dependencies without asking.** Everything in this brief is buildable
   with what is installed. If you think you need a library — a toast library, a
   tour library, an animation library, an audio file — you have misread the brief.
   The whole point is that this app synthesizes its own sounds and hand-rolls its
   own motion, and that consistency is the product.
2. **Reuse before you write.** This codebase has a helper for almost everything.
   Part 5 is a reference table of them. If you are about to write a date
   formatter, a class merger, a muscle-group resolver, a signed-URL hook, a
   confirm pattern, or a bottom sheet — stop, it already exists.
3. **Every new file gets a prose header comment** explaining *why it exists*, not
   what it does. Match the existing voice (Part 2.1).
4. **`npm run build` and `npm run lint` must both pass** when you are done. Not
   "mostly pass." Not "pass with the new files excluded."
5. **Do not reformat files you are editing.** No prettier sweeps, no import
   reordering, no converting `function` to arrow. Your diff should contain only
   your change.
6. **Do not touch `dist/`.** It is a committed build artifact; it regenerates.
7. **When a spec here conflicts with something you find in the code, the code
   wins — but tell the user.** This brief was written from a reading of the repo
   at v1.2.1. If a file has moved, say so rather than inventing a path.

### 0.4 How to sequence the work

Part 3 is grouped into six phases, **A through F, in dependency order**. Phase A
builds two shared foundations that four later items consume. Do not start Phase B
until Phase A compiles and runs.

Within a phase, commit (or at minimum, check in with the user) after each
numbered item. Twenty changes in one unreviewable blob is how a good release
becomes an unshippable one.

If you get blocked on an item — genuinely blocked, not just "this is fiddly" —
**skip it, finish everything else, and report exactly what you left and why.**
Do not silently narrow the scope. Do not stub a feature and call it done.

---

## Part 1 — Codebase orientation

Read this section with the repo open. It will save you an hour of spelunking.

### 1.1 Directory layout

```
src/
  app/            AppShell (header, nav, swipe), BottomNav, Screen transition, nav config
  components/
    ui/           The primitive kit. Barrel-exported from ui/index.ts.
    ExercisePicker.tsx   Shared by Train and Split. Not in ui/ because it is domain-aware.
    ErrorBoundary.tsx
  config.ts       APP_NAME, APP_TAGLINE, STORAGE_KEY, SCHEMA_VERSION.
  data/           Static content: exercise library, muscle map, templates, playbook,
                  quotes, facts, achievements, stretches, release notes.
  features/       One folder per surface. Each owns its own components.
    auth/ dashboard/ friends/ learn/ notifications/ onboarding/ physique/
    progress/ settings/ split/ stretch/ system/ train/ you/
  lib/            Pure-ish helpers. No React.
  store/          Zustand stores.
  theme/          Theme provider, palettes, accent handling, display fonts, motion presets.
  types/          Shared TS types (index.ts for the app, social.ts for the social layer).
```

The `features/` convention is loose but real: a folder owns its screen and every
component only that screen uses. When something gets used by two features it moves
to `components/`. That is why `ExercisePicker` sits where it does — Train and Split
both open it.

### 1.2 The four stores

This is the single most important thing to internalize.

**`src/store/useStore.ts` — the persisted store.** Everything the user owns:
settings, profile, split, saved splits, history, PRs, body weight, goals,
supplements, achievements, playbook progress, custom stretches/routines/exercises,
and the in-progress session. Persisted to `localStorage` (via `src/lib/storage.ts`)
under key `mettle.v1`, at `SCHEMA_VERSION = 3`.

**`src/store/useUI.ts` — ephemeral navigation and overlay state.** Current screen,
transition direction, nav params, overlay count (which suppresses swipe-nav), the
"What's new" flag, the achievement-unlock queue, the `cinematic` flag, and the
session-intro name. **Not persisted, by design** — a reload should land you home.

**`src/store/useAuth.ts` — Supabase session.** Status (`loading` / `signed-in` /
`signed-out`), the user object, email, sync status, and the password-recovery
flow. It also owns the auto-sync subscription: any change to `useStore` schedules
a debounced push to the cloud (`useAuth.ts:79-100`).

**`src/store/useSocial.ts` — friends, requests, presence, my published profile.**
Deliberately **not** persisted, with a comment explaining why: stale friend data
shown as if it were live is worse than no friend data.

Two smaller stores follow the same ephemeral pattern: `useNotifications.ts` (the
bell) and `usePhysique.ts` (check-in photos).

### 1.3 The persistence contract

Read this before adding any stored field. `useStore.ts:500-569` configures
`persist` with four hooks, and **all four matter**:

- **`version: SCHEMA_VERSION`** and **`migrate`** — runs when a persisted blob is
  older than the current version. It currently handles two migrations: the theme
  collapse at v2, and the Recovery-into-Stretch tab merge at v3.
- **`merge`** — deep-merges the persisted blob *over the defaults*. This is what
  makes new fields safe: someone who installed at v1.2.1 has no `injuries` key,
  and `merge` hands them the default. **Nested objects need an explicit spread**
  or the persisted blob replaces the default wholesale. `settings.tabs`,
  `settings.display` and `playbook` each get one, and there is a comment saying
  exactly that.
- **`partialize`** — the allowlist of what actually gets written. **A field
  missing from `partialize` is not persisted**, no matter what else you do.

So adding a persisted field is a four-touch change: the `AppData` interface, the
`initialData` default, `partialize`, and — if it is nested — `merge`. Miss one and
you ship a bug that only appears on the second launch.

Bump `SCHEMA_VERSION` only if you need a `migrate` step. Adding a field with a
sane default does not require a bump; `merge` covers it.

### 1.4 The UI primitive kit

`src/components/ui/index.ts` barrel-exports `Button`, `Card`, `CardLabel`,
`Segmented`, `Switch`, `PageHeader`, `EmptyState`, `Sheet`, `Stepper`, `CountUp`,
`Sortable`, `Pressable`, `PressableCard`.

Two have non-obvious behaviour you need to know about.

**`Sheet`** renders through a **portal to `document.body`**, and its header
comment explains exactly why: `filter`, `backdrop-filter` and `transform` all
create a containing block for `position: fixed` descendants, and the app header
uses `backdrop-blur-xl`. A sheet opened from inside the header had its
full-screen backdrop clamped to the 56px header — covering the header, swallowing
every tap on it, and dropping the panel in the wrong place. **Do not "simplify"
this back to an inline render.** `Sheet` also registers itself via
`useUI.pushOverlay()` / `popOverlay()` so swipe-between-tabs is suppressed while
it is up. Anything new you build that covers the screen should do the same.

**`Stepper`** is the numeric input used throughout the logger: value, onChange,
step, min/max, `decimal`, `placeholder`, `aria-label`, `className`. Use it rather
than a bare numeric input anywhere a number is being dialled.

### 1.5 Theming

`src/index.css` declares a `@theme inline` block mapping Tailwind's color, radius,
shadow and font tokens onto CSS custom properties, then defines those properties
per theme. So `bg-canvas`, `text-fg-muted`, `border-border`, `bg-accent-soft`,
`rounded-card`, `rounded-btn`, `shadow-pop` and `font-display` are all real
Tailwind classes backed by swappable variables.

There are several themes (dark, light, and tinted variants), plus a
user-overridable accent (`settings.accent`) and a switchable display font
(`settings.displayFont`, scoped to either the wordmark or every heading). All of
that works *only* because nothing hardcodes a color.

Useful non-obvious tokens: `--accent-grad` (a linear-gradient, applied through the
`bg-accent-grad` utility), `--accent-glow` (a ready-made box-shadow string),
`--accent-soft` (the translucent fill behind icons), and `--edge-highlight` and
`--sheen` for the glassy card treatment.

### 1.6 Sound

`src/lib/sound.ts` synthesizes every effect with the Web Audio API on **one shared
`AudioContext`**, unlocked on the first user gesture — iOS will not let a timer
callback start audio, so a per-call context stays suspended and silent. Every
effect goes through `fx(name, play, gapMs)`, which respects the global `soundFx`
setting via the module-level `fxEnabled` flag and debounces by name.

The palette today: `sfxPop`, `sfxSetDone`, `sfxFanfare`, `sfxSessionStart`,
`sfxAchievement`, `sfxNotify`, `sfxCountdownTick`, `sfxSparkle`, plus `playChime`
for the rest timer (which has its own separate `restChime` setting).

All of them are built from one helper: `note(freq, at, dur, peak, type)`. You are
about to add the first effect that is *not* a stack of oscillator notes — see
item C8.

### 1.7 Motion

`src/theme/motion.ts` is the single source of springs and variants: `spring`,
`springPop`, `easeOut`, `cinematic`, `listContainer` and `listItem`,
`heroContainer` and `heroItem`, `revealBlur`, `tapScale`, `tapCard`,
`ambientGlow`, `pulseOnce`.

**Nothing in the app declares its own spring inline.** If you need a new shared
motion idiom, add it here with a comment explaining its role, the way
`ambientGlow` documents itself:

> Slow ambient pulse for surfaces that should look alive at rest — the streak
> card, the next-workout prompt. Deliberately long and low-contrast: it should
> register at the edge of vision, never demand attention.

### 1.8 The z-index ladder

Already in use. Stay inside it.

| Layer | z |
| --- | --- |
| Header | `z-30` |
| Menu backdrop / dropdown | `z-40` / `z-50` |
| Achievement toast | `z-[55]` |
| Sheets (backdrop and panel) | `z-[60]` |
| Finish celebration | `z-[70]` |
| Session intro | `z-[75]` |

New full-screen teaching overlays (Phase F) go **above sheets but below the
celebration** — `z-[65]` — so a coach mark can point at something inside a sheet,
but never covers the finish moment.

---

## Part 2 — House style contract

This codebase has a voice. Matching it is not optional polish; it is the
difference between a release that reads as one product and one that reads as a
good app with a contractor's patch bolted on.

### 2.1 Comments explain *why*, in prose

The rule: if a reader could work out *what* the code does by reading it, do not
write that. Write the thing they could not have known — the constraint, the bug
that forced this shape, the option you rejected.

Real examples from the repo, quoted so you can hear the register:

> Clamped at zero: nowTick is captured at mount, so a session started a moment
> later would briefly read negative.

> Never toggle visibility straight from a tap — a mis-tap in a grid would publish
> a photo of your body.

> Deliberately the same reply whether or not that address has an account —
> otherwise this doubles as a "does X have a Mettle account" oracle.

> Rather than hand-maintaining a 112-entry table that goes stale the moment
> someone adds a custom exercise, regions are resolved by ordered pattern rules
> with a small override table for the handful the rules misread.

Notice: full sentences, no Javadoc tags, no `@param`, no restating the signature.
Some are one line above a statement; module-level ones are a block at the top of
the file. Write like the person who will maintain this is smart and busy.

### 2.2 Colors come from tokens, never from hex

There is not a single raw hex in a component file, and there must not be one after
you are done. If you need a color that does not exist as a token, either compose
it (`color-mix(in srgb, var(--accent) 55%, transparent)` is used in several
places) or add a token to `src/index.css` for **every** theme block. Adding it to
the dark block alone breaks light mode silently.

Amber/warning states use `--warning`. Destructive uses `--danger`. Positive uses
`--success`. They already exist in every theme.

### 2.3 Motion comes from `src/theme/motion.ts`

Import `springPop` rather than typing `{ type: 'spring', stiffness: 500, damping: 24 }`.
If a new animation genuinely needs its own curve, add the preset to `motion.ts`
with a comment about when to reach for it.

**Every looping or large-motion animation you add must respect
`prefers-reduced-motion`.** The app does not currently have a helper for this —
add one to `motion.ts` as part of Phase A:

```ts
/** True when the OS asks for less motion. Read once per mount; the query is
 *  cheap but the value effectively never changes mid-session. */
export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
```

Then: reduced motion means the *outcome still happens* — the toast still appears,
the workout still posts, the flame still shows — it just arrives without the
travel. Never gate functionality behind an animation.

### 2.4 Feedback: haptics on every interaction

`src/lib/haptics.ts` exposes `tap`, `select`, `success`, `warn`. The convention in
use:

| Situation | Call |
| --- | --- |
| Ordinary button, toggling a field | `haptics.tap()` |
| Choosing from a list, a segment, a chip | `haptics.select()` |
| Something completed — set done, saved, accepted | `haptics.success()` |
| Something destructive or blocked — delete, end workout, invalid entry | `haptics.warn()` |

Every interactive element you add gets one. It is a one-line call and its absence
is immediately noticeable on a phone.

### 2.5 Destructive actions use the two-tap pattern, never `window.confirm`

The established idiom, used in at least four places
(`Settings.tsx:290-307`, `MyPhysique.tsx:197-214`, `Split.tsx:200-219`,
`Train.tsx:796-814`):

```tsx
onClick={() => {
  if (!confirmX) {
    setConfirmX(true);
    setTimeout(() => setConfirmX(false), 3000);
    return;
  }
  haptics.warn();
  actuallyDoIt();
}}
```

with the button's label changing to say what the second tap will do — "Tap again
to confirm", "Tap again — this deletes it", "Tap again — it goes on the board".
The label change is the important half. A button that silently arms itself is a
trap.

### 2.6 Accessibility basics that are already honoured

- **Every icon-only button has an `aria-label`.** Grep the repo — there are no
  exceptions today. Do not create the first one.
- **Safe-area insets** on anything fixed to an edge:
  `style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}`, and
  `paddingTop: 'env(safe-area-inset-top)'` on the header. This is an installed
  PWA on notched phones; forget it and content sits under the Dynamic Island.
- **Tabular numbers** — the `tabular` class — on anything that counts up or
  changes in place, so digits do not jitter.
- Class merging goes through `cn()` from `src/lib/cn.ts` (clsx + tailwind-merge),
  never string concatenation.

### 2.7 Copy voice

The user-facing writing in this app is plain, warm, and never markety. It explains
consequences rather than issuing warnings. Compare:

- Not "Are you sure? This action cannot be undone." — instead, the app's actual
  line: *"They'll no longer be able to see your progress — your workouts, streak,
  PRs and any check-ins you've shared — and you won't see theirs. You can add
  each other again later."*
- Not "Error: invalid input." — instead: *"Could not read that file."*
- Not "Congratulations!!" — instead: *"Workout complete."*

Sentence case for everything except the tiny uppercase eyebrow labels
(`CardLabel`, which is `text-[11px] font-bold uppercase tracking-[0.12em]`). Em
dashes are used liberally. Curly apostrophes in prose strings.

Write every new string in this voice, including toast text, FAQ answers, tutorial
captions and injury reasons.

---

## Part 3 — The twenty work items

Six phases in dependency order. Each item gives you **what exists today**, **what
to build**, **files to touch**, and **acceptance criteria**. The acceptance
criteria are how the user will check your work — treat them as the definition of
done.

---

## Phase A — Foundations

Two shared pieces that four later items consume. Nothing else starts until these
compile and run.

### A1 — A real toast system

**What exists today.** Four screens hand-roll the identical toast: a
`useState<string | null>`, a `setTimeout` that clears it, and a fixed-position div
near the bottom of the screen. They are at:

| File | State | Render |
| --- | --- | --- |
| `src/features/settings/Settings.tsx` | `:76-81` | `:344-348` |
| `src/features/split/Split.tsx` | `:50`, `:119-120` | `:372-376` |
| `src/features/friends/FriendProfile.tsx` | `:58`, `:98-99` | `:435-439` |

They are not identical in detail — two sit at `bottom-[100px]`, one at
`bottom-[110px]` — so they visibly disagree with each other, and none of them can
be dismissed, queued, or given an action. Meanwhile `AchievementUnlock.tsx` is a
*genuinely good* transient notification that already solves queueing, dismissal,
and the "hold this back while a cinematic moment owns the screen" problem.

**What to build.** A single app-wide toast system modelled on
`AchievementUnlock.tsx`, then migrate all three call sites onto it.

State goes in `src/store/useUI.ts` — it belongs there for the same reason the
unlock queue does: anything anywhere should be able to raise one, and the toast
must survive a screen change.

```ts
export type ToastTone = 'neutral' | 'success' | 'danger';

export interface Toast {
  id: string;
  message: string;
  tone: ToastTone;
  /** Optional single action, e.g. Undo. Dismisses the toast when pressed. */
  action?: { label: string; onPress: () => void };
  /** Milliseconds on screen. Default 2600. */
  duration?: number;
  /** Play a sound as it lands. Off by default — most toasts should be silent. */
  sound?: 'pop' | 'woosh' | 'notify';
}
```

Add `toasts: Toast[]`, `toast: (t: Omit<Toast, 'id'>) => void`, and
`dismissToast: (id: string) => void`. Use `uid()` from `src/lib/id.ts` for ids.
Cap the queue at three and drop the oldest — a burst of toasts should never
build a wall.

The component is `src/features/system/Toaster.tsx`, mounted in
`src/app/AppShell.tsx` right beside `<AchievementUnlock />`. Requirements, most
of which you can lift straight from `AchievementUnlock.tsx`:

- Fixed, bottom-centre, `bottom-[74px]` so it clears the floating nav, with
  `paddingBottom: env(safe-area-inset-bottom)`.
- `z-[55]`, matching the achievement toast — they are peers, and stacking them is
  correct: if both are up, the toast sits above the achievement with a small gap.
- `pointer-events-none` on the wrapper, `pointer-events-auto` on the pill, so the
  screen underneath stays usable.
- `AnimatePresence` with `initial={{ opacity: 0, y: 16, scale: 0.96 }}`, animating
  to rest, `exit={{ opacity: 0, y: 10, scale: 0.98 }}`, transition `springPop`.
- An X button on the right with `aria-label="Dismiss"` that removes it
  immediately. **The user asked for this explicitly** — "U can also press x to
  get quickly rid of it."
- The auto-dismiss timer **does not run while `useUI.cinematic` is true.** This
  is the trick `AchievementUnlock` already uses (`:59-63`) and the reason is good:
  a toast raised under the finish celebration would burn its whole life
  unwatched.
- Tone maps to the border and the small leading icon only — `neutral` uses
  `border-border`, `success` uses `border-success/40` with a `Check`, `danger`
  uses `border-danger/40` with a `TriangleAlert`. The pill body stays
  `bg-elevated/95 backdrop-blur-xl` in all three, matching the achievement toast.
  Do not make a red toast with a red background; this app whispers.
- Under `prefersReducedMotion()`, skip the y-travel and just cross-fade.

Then **migrate the three existing call sites** and delete their local toast state
and markup. `Settings.tsx`'s `flash()` helper becomes a one-line call to the
store. This is a net deletion of code, which is the point.

**Files:** `src/store/useUI.ts`, new `src/features/system/Toaster.tsx`,
`src/app/AppShell.tsx`, `src/features/settings/Settings.tsx`,
`src/features/split/Split.tsx`, `src/features/friends/FriendProfile.tsx`,
`src/theme/motion.ts` (for `prefersReducedMotion`).

**Acceptance criteria.**
1. Exporting a backup, importing a file, saving a split preset and copying from a
   friend profile all still show their message — now from one component, at one
   position.
2. Tapping the X dismisses instantly.
3. Raising a toast during the finish celebration shows it *after* the celebration
   ends, with its full duration intact.
4. No screen contains a local `const [toast, setToast]` any more.

### A2 — Group-an-exercise-list helper

**What exists today.** `Train.tsx:174-180` builds a `Set` of lowercased cardio
names by scanning `EXERCISE_LIBRARY` plus `customExercises`. That is the only
place in the app that resolves an arbitrary exercise name back to its
`MuscleGroup`, and item B4 needs the same resolution for every group, not just
Cardio.

**What to build.** `src/lib/exerciseGroups.ts`:

- `groupOf(name: string, customExercises: CustomExercise[]): MuscleGroup | null` —
  case-insensitive lookup across the built-in library then the user's customs.
  Memoise it the way `regionsFor` does in `muscleMap.ts:184-194`: a module-level
  `Map` keyed on the lowercased name. Invalidate on customs change by keying the
  cache entry with the customs length, or simply skip caching customs — they are
  a short list.
- `groupExercises<T>(items: T[], nameOf: (item: T) => string, customExercises): { group: MuscleGroup | 'Other'; items: T[] }[]` —
  buckets a list, preserving **the original order within each bucket** and
  emitting buckets in `MUSCLE_GROUPS` order. Anything unresolvable lands in a
  final `'Other'` bucket rather than being dropped.

Generic over the item type on purpose: Train passes `ActiveExercise` objects,
Split could later pass `SplitExercise`, and neither should have to reshape data
to use it.

Then refactor `Train.tsx`'s `cardioNames` memo to use `groupOf` so there is one
resolver, not two.

**Acceptance criteria.** `Train.tsx` no longer builds its own name-to-group set;
the new module is pure, has no React import, and is covered by the existing lint
rules.

---


## Phase B — The training screen

This is the core loop and the screen the user spends the most time in. Four
changes, all in or around `src/features/train/Train.tsx` (832 lines, the largest
component in the app).

### B3 — Hours and minutes in the session clock

*User's words: "When training, display hours and minutes, not just minutes :)."*

**What exists today.** `fmtDuration` in `src/lib/date.ts:60-65`:

```ts
export function fmtDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${String(s).padStart(2, '0')}s`;
}
```

A ninety-minute session reads `90m 12s`. It should read `1h 30m 12s`.

**What to build.** Extend the ladder to three tiers:

- under a minute: `45s`
- under an hour: `12m 04s` (unchanged — do not break the common case)
- an hour or more: `1h 30m 12s`, with the minutes zero-padded to two digits so
  the string does not jump width as it ticks

The clock is rendered at `Train.tsx:486-491` at `text-[34px]` with `tabular`, and
it re-renders every second from the `nowTick` interval, so width stability
matters visually.

**Audit every caller** before you ship. It is used by the live session clock
(`Train.tsx:325`) and inside the "End workout?" sheet copy (`Train.tsx:779`). If
any progress or history view formats a duration by hand, route it through this
function too rather than leaving a second dialect in the codebase.

**Acceptance criteria.** Start a session, temporarily seed `startedAt` an hour
back, and confirm the header reads `1h 00m 03s` and keeps ticking without the
layout shifting.

### B4 — Muscle-group sections in the logger

*User's words: "Training looks messy if theres many exercises. Make individual
sections based on the muscle groups."*

**What exists today.** `Train.tsx:494-752` maps `session.exercises` into one flat
`space-y-3` stack. On a nine-exercise full-body day that is a long
undifferentiated scroll with no landmarks.

**What to build.** Group the cards using `groupExercises` from A2. Each group gets
a header row above its cards:

- The group name in the eyebrow style — `text-[11px] font-bold uppercase
  tracking-[0.12em] text-fg-subtle` — matching the section labels already used on
  the You screen (`You.tsx:31-36`).
- A quiet progress readout on the right: `4/9 sets`, counting `done` sets across
  that group's exercises, in `tabular`.
- The header is tappable to collapse the group. Collapsed state is **local
  component state, not persisted** — this is a per-session convenience, and a
  collapsed group surviving a reload would hide real work.
- When every set in a group is done, the header gets a small `Check` in
  `text-accent` and the group auto-collapses **once**, the first time it
  completes. Do not fight the user: if they reopen it, it stays open.

**The trap, and it is a real one.** Every mutator in this file is index-based:
`patchSet(ei, si, …)`, `addSet(ei)`, `removeLastSet(ei)`, `removeExercise(ei)`,
`addWarmup(ei, …)`, and the `tools` state carries `{ ei, name, target }`. Those
indices are positions in `session.exercises`. If you group by mapping over
buckets, the inner map index is a *bucket-local* index and every mutation will
hit the wrong exercise.

So: have `groupExercises` carry the original index through, or build buckets as
arrays of `{ exercise, ei }` pairs before rendering, then pass `ei` exactly as
today. Verify by deleting the last exercise of the first group in a multi-group
session and confirming the right card disappears.

Keep the single-group case clean: if everything resolves to one group, render the
header anyway for consistency rather than special-casing it away.

**Acceptance criteria.** A Push day shows Chest, Shoulders and Arms as separate
labelled sections in `MUSCLE_GROUPS` order. Ticking sets updates the right
header's count. Collapsing a group hides its cards and nothing else. Every
existing per-exercise control still acts on its own exercise.

### B5 — Swap or replace an exercise mid-session

*User's words: "if for some reason your training and want to change/add an
excersize, make it so we can tape replace excercises when selecting an exercise
on «add» when training."*

**What exists today.** `ExercisePicker` (`src/components/ExercisePicker.tsx`) is
add-only: the title is hardcoded to "Add exercise", `onPick(name)` appends, and an
`exclude` list greys out names already in the session. There is no way to say
"actually, do incline dumbbell press instead of incline barbell" without deleting
the exercise — which throws away any sets already logged against it.

**What to build.** Two parts.

*Part one, the picker.* Add optional props:

```ts
mode?: 'add' | 'replace';
/** The movement being replaced. Names the sheet and seeds the shortlist. */
replacing?: string;
```

In `replace` mode the sheet title becomes `Replace Bench Press` and the picker
**closes after a pick**. In add mode it deliberately stays open so several can be
added in a row — that is documented in its header comment, and you must not break
it.

Also in replace mode, surface a shortlist at the top under a `Similar movements`
label: exercises sharing the replaced movement's primary muscle region, resolved
with `regionsFor()` from `src/data/muscleMap.ts` and ranked by region overlap.
This is the small piece of intelligence that makes the feature feel considered
rather than mechanical, and the machinery already exists — you are wiring, not
inventing.

*Part two, the affordance.* `Train.tsx:543-560` has a per-exercise control cluster
(a `Calculator` for tools, a `Trash2` for remove). Add an `ArrowLeftRight` button
between them with an `aria-label` naming the exercise, opening the picker in
replace mode for that `ei`.

The swap handler **keeps the sets and changes the name**:

```ts
const replaceExercise = (ei: number, name: string) =>
  update((s) => ({
    ...s,
    exercises: s.exercises.map((ex, i) =>
      i !== ei ? ex : { ...ex, name, targetReps: undefined },
    ),
  }));
```

One subtlety worth a comment in the code: the "Last · 80kg × 8" line and the
"Try 82.5" suggestion are derived from `history` keyed on the exercise name, so
they re-derive correctly for the new movement on the next render. But
`targetReps` came from the split and now describes a different exercise — clear
it on swap rather than carrying a stale range across. Hence the `undefined` above.

Give `Split.tsx` the same affordance on its exercise rows (`Split.tsx:231-275`).
There, replace swaps the entry in `day.exercises` while **preserving**
`targetSets` and `targetReps` — the user planned those numbers for that slot, and
the slot is what persists.

Raise a toast on swap: `Swapped to Incline Dumbbell Press`.

**Acceptance criteria.** Mid-session, tapping swap on an exercise with two logged
sets opens a sheet titled "Replace Bench Press", shows similar chest movements
first, and on pick keeps both logged sets under the new name. The picker closes.
A toast confirms.

### B6 — Exercise-deleted toast with undo

*User's words: "A timed little round noti from bottom saying «exercise deleted»
U can also press x to get quickly rid of it."*

**What exists today.** `removeExercise` (`Train.tsx:369-370`) filters the exercise
out and the row silently vanishes. Since sets may already be logged against it, a
mis-tap on the trash icon is a real loss with no recovery.

**What to build.** Capture the removed exercise before filtering, and raise a
toast with an Undo action that splices it back at its original index:

```ts
const removeExercise = (ei: number) => {
  const removed = session.exercises[ei];
  if (!removed) return;
  update((s) => ({ ...s, exercises: s.exercises.filter((_, i) => i !== ei) }));
  haptics.warn();
  useUI.getState().toast({
    message: removed.name + ' removed',
    tone: 'danger',
    action: {
      label: 'Undo',
      onPress: () =>
        update((s) => ({
          ...s,
          exercises: [...s.exercises.slice(0, ei), removed, ...s.exercises.slice(ei)],
        })),
    },
  });
};
```

The user asked for the text "exercise deleted". Naming the actual exercise is
strictly better, costs nothing, and matches the copy voice in Part 2.7 — do that.

**Acceptance criteria.** Deleting an exercise shows a rounded pill rising from the
bottom reading "Bench Press removed", with Undo and an X. Undo restores it in its
original position with its sets intact. The X dismisses immediately. It
auto-dismisses after about 2.6 seconds.

---

## Phase C — Sending it out

This is the release's showpiece. Get it right and the whole app feels different.

### C7 — The paper-airplane send

*User's words: "when publicly sending something like a total to the board, make an
animation that crumbles and shoot it upwards you know send it out like a paper
airplane like ripping a piece of paper with a sound effect of course like a sound
effect a long woosh."*

**What exists today.** `Train.tsx:455-472` (`handleConfirmFinish`) ends the
session, then fires this, with a comment calling it fire-and-forget:

```ts
useSocial.getState().publishFinishedWorkout(result.entry, result.prHits);
```

and immediately shows `<Celebration />`. The publish is completely invisible. The
most social thing the app does happens with no acknowledgement at all.

**What to build.** A one-shot overlay, `src/features/train/SendOff.tsx`, that
plays *between* the finish sheet closing and the celebration appearing. Three
beats, roughly 1.5 seconds total:

**Beat 1 — the sheet (0 to 400ms).** A card rendered to look like the workout
summary: day name, three stats (exercises / sets / volume), PR names if any. Build
it from `EndSessionResult`, which you already have in hand. Styled like a page
torn from a notebook — `bg-surface` with a slight rotation, `shadow-pop`, and a
subtle paper texture using the existing `--sheen` gradient. It sits centred at
roughly 60% viewport width.

**Beat 2 — the crumple and fold (400 to 900ms).** The card compresses. Do this
with a keyframe array on framer-motion rather than a real physics sim:

```tsx
animate={{
  scaleX: [1, 0.86, 0.28],
  scaleY: [1, 0.94, 0.34],
  rotate: [-2, 4, -8],
  skewX: [0, -6, 3],
  filter: ['blur(0px)', 'blur(0.5px)', 'blur(1.5px)'],
  opacity: [1, 1, 0],
}}
transition={{ duration: 0.5, times: [0, 0.45, 1], ease: easeOut }}
```

Cross-fade an inline paper-plane SVG in over the last 150ms, so the card appears
to *become* the plane rather than being replaced by it. Draw the plane yourself —
two triangles and a fold line, `fill="var(--accent)"` for the top face and
`color-mix(in srgb, var(--accent) 65%, black)` for the underside so it reads as
folded paper rather than a flat glyph. Lucide's `Send` icon is an outline and will
look wrong here.

**Beat 3 — the launch (900 to 1500ms).** The plane flies up and off the top of the
screen along a shallow arc, tumbling slightly:

```tsx
animate={{ x: [0, 40, 120], y: [0, -140, -900], rotate: [-8, 12, 28], scale: [1, 0.9, 0.45] }}
transition={{ duration: 0.6, ease: [0.32, 0, 0.67, 0] }}
```

Note that easing — an *ease-in* curve, accelerating away, which is what "shot"
means. Leave a short accent-tinted motion trail behind it: two or three copies of
the plane at lower opacity with staggered delays, or a thin tapering
`linear-gradient` streak. Keep it subtle; this is one beat, not a firework.

**Wiring.** In `handleConfirmFinish`, when the workout will actually be published
(see C9 for that condition), set a `sendOff` state carrying the result and let
`SendOff` call back into the existing celebration path when it finishes. When it
will not be published, skip straight to the celebration as today — a private
workout should not perform a send.

`SendOff` must call `useUI.getState().setCinematic(true)` on mount and `false` on
unmount, exactly as `SessionIntro` and `Celebration` do, so toasts hold their
place underneath it. Render it at `z-[70]`, the celebration's tier, since it is
part of the same uninterruptible moment.

**Reduced motion.** Under `prefersReducedMotion()`, skip the whole overlay. The
workout still publishes, the toast from C9 still appears, and the celebration
still plays. Do not build a "gentler" version — a shortened crumple is worse than
none.

**Acceptance criteria.** Finishing a workout with sharing on plays: summary card,
crumple, fold, launch, then the existing celebration. Total added time under
1.6 seconds. With sharing off, nothing changes from today. With reduced motion on,
nothing changes from today.

### C8 — The long woosh

*The user asked for it twice, and specified "a long woosh". Take the "long"
seriously — the existing palette is all sub-300ms blips, and this one wants to be
600 to 800ms so it can carry the launch.*

**What exists today.** Every effect in `src/lib/sound.ts` is a stack of
`OscillatorNode`s built by the `note()` helper. That is perfect for chimes and
useless for a woosh, which is fundamentally filtered noise.

**What to build.** Add `sfxWoosh()` to `src/lib/sound.ts`, the first effect using
a noise source. The node graph:

1. **Source.** Generate white noise once into an `AudioBuffer` and cache it at
   module scope — regenerating a second of random floats on every call is
   wasteful. About 1 second at `c.sampleRate`, filled with
   `Math.random() * 2 - 1`. Play it through a `BufferSourceNode`.
2. **Band-pass filter.** A `BiquadFilterNode`, `type = 'bandpass'`, `Q` around
   1.2. Sweep the frequency: start near 300Hz, ramp exponentially up to about
   2400Hz by 55% through, then back down to 500Hz by the end. That rise-then-fall
   is the whole character of a "woosh" — a monotonic sweep sounds like a laser,
   not paper.
3. **Gain envelope.** A `GainNode`: fade in over ~80ms to a peak of about 0.11
   (match the existing palette's restraint — `sfxFanfare` peaks at 0.13), hold,
   then a long exponential decay to silence. Total ~700ms.
4. Optionally layer a very quiet high-frequency "paper rustle": a second, shorter
   noise burst through a high-pass at ~3kHz at peak 0.03, fired at t=0 for 120ms.
   This sells the *paper* half of the sound. Keep it quiet enough that it reads as
   texture, not as a second effect.

Wrap it in the existing `fx()` gate with a generous debounce — `fx('woosh', …, 900)`
— so it can never double-fire. Disconnect nodes in `onended`, exactly as every
other effect in the file does, or you will leak nodes across a long session.

Add a header comment above it explaining that this one is noise-based and why
`note()` could not be reused. That is precisely the kind of thing this codebase
documents.

Fire it from `SendOff` at the start of Beat 2, so the crumple and the sound begin
together and the launch rides the tail.

**Acceptance criteria.** Finishing a shared workout plays an audible rising-then-
falling rush lasting most of a second. Turning off Sound effects in
Settings → Feel silences it. It never plays twice on one finish.

### C9 — Silent versus public post notification

*User's words: "I also want a little notification hitter that comes from the
bottom, saying whether you posted being silent and when you post publicly
announces that as well, but this time with sound."*

**What exists today.** `useSocial.publishFinishedWorkout` (`useSocial.ts:136-141`)
already contains exactly the branch you need:

```ts
publishFinishedWorkout: (entry, prHits) => {
  const { userId, myShared } = get();
  if (!userId || !myShared) return;
  if (myShared.privacy.shareWorkouts) void social.publishWorkout(userId, entry, prHits);
  void social.publishSharedProfile(userId, myShared.privacy);
},
```

`myShared.privacy.shareWorkouts` is the flag, toggled in Settings → Friends and
privacy (`SocialSection.tsx:162-172`). The user currently gets no feedback either
way — they cannot tell whether a workout went to their friends or stayed private,
which is a genuine trust problem in a fitness app.

**What to build.** Have `publishFinishedWorkout` return a small result rather than
`void`, so the caller knows what happened:

```ts
publishFinishedWorkout: (entry, prHits) => 'published' | 'private' | 'offline'
```

`'offline'` when there is no `userId` / `myShared` — a signed-out or unconfigured
build should say nothing at all rather than claiming privacy it is not enforcing.
Return early with `'offline'` in that case and let the caller skip the toast.

Then in `Train.tsx`, after the send-off completes:

- **Published:** toast with `tone: 'success'`, message *"Posted to your friends"*,
  and `sound: 'woosh'`… except the woosh already played during the launch. Use
  `sfxPop()` here instead, or pass no sound and let the send-off carry the audio.
  Decide once and write down which you chose in a comment. The user's instruction
  was "with sound" for the public case — the send-off woosh satisfies that, and
  doubling up would be noise.
- **Private:** toast with `tone: 'neutral'`, **no sound at all**, message
  *"Saved privately — sharing is off"*, and an action `{ label: 'Settings',
  onPress: () => navigate('settings', { section: 'social' }) }`. That action turns
  a passive notice into a one-tap fix, which is the difference between informing
  someone and helping them.

The asymmetry the user described — public is announced, private is silent — is
exactly right, and worth honouring precisely: the private toast should not even
use `haptics`.

**Acceptance criteria.** With sharing on, finishing plays the send-off and lands a
success toast. With sharing off, finishing skips the send-off entirely and lands a
silent neutral toast with a Settings shortcut. Signed out, no toast appears.

---

## Phase D — Identity, settings, social

### D10 — Retire the "M" tile

*User's words: "remove the logo like the M logo and just make it mettle It looks
way better. That way it doesn't look repetitive. so what I'm asking is remove the
colored logo with the M and just leave the header of the full name."*

**What exists today.** Two places render an accent-gradient rounded square
containing `APP_NAME[0]` immediately next to the full wordmark, so the letter M
appears twice in a row:

- `src/app/AppShell.tsx:88-93` — the 32px header tile
- `src/features/onboarding/Onboarding.tsx:92-98` — the 64px welcome tile

**What to build.** Delete both tiles. Keep the wordmark.

Do not stop at deletion, though — removing the only colored element from the
header will leave the left side looking under-weighted against the notification
bell and settings cog on the right. Rebalance:

- Bump the header wordmark from `text-[16px]` to about `text-[19px]` and keep
  `leading-none`. It is set in the `wordmark` class (`index.css:448`), which
  already applies the display font, uppercase, and a width stretch.
- Give it the accent as a gradient text fill so the brand still carries color:
  `bg-accent-grad bg-clip-text text-transparent`. Verify in **every** theme,
  including the light ones — a gradient tuned for the dark canvas can wash out.
  If it does not hold up across themes, fall back to plain `text-fg` and leave
  the color entirely to the accent elsewhere. Plain and legible beats clever and
  muddy.
- On the onboarding welcome screen the wordmark already uses `display-hero`, so
  removing the tile just needs the `mb-6` spacing it leaves behind tightened.

Check for other renders of `APP_NAME[0]` before you finish. `Settings.tsx:314` in
the About card renders the wordmark alone and is already correct.

**Acceptance criteria.** No square accent tile with a letter in it anywhere in the
app. The header still reads as branded. Light, dark and tinted themes all look
deliberate.

### D11 — Your account on the You screen

*User's words: "See what mail and password you use on u. Should be hidden first."*

**Read this before you write any code.** Supabase stores a **bcrypt hash** of the
password, not the password. There is no API, no admin call, and no client trick
that returns the plaintext. It is not a permission you are missing — it does not
exist anywhere in the system. Any implementation that appears to show the user
their password would have to store the plaintext yourself at sign-in, which would
put it in `localStorage` for anyone with the unlocked phone or a copy of the
backup export to read. **Do not do that.** The user has been told this and has
agreed to the design below.

**What to build.** A new card, `src/features/you/Account.tsx`, rendered in the
"Body" section list at the top of `You.tsx:19` — actually, add a fourth section
above the others titled `Account`, or place it first in `Body`; either reads
fine, pick one and be consistent. It returns `null` when
`useAuth(s => s.status) !== 'signed-in'`, matching how `MyPhysique` guards itself
(`MyPhysique.tsx:42`).

Contents:

- **Email row.** Read from `useAuth(s => s.email)`. Masked by default as
  `m•••••@gmail.com` — keep the first character of the local part and the full
  domain, replace the rest with bullets. An eye / eye-off toggle button reveals
  the full address, with `aria-label="Show email"` / `"Hide email"`. Local
  component state, never persisted; it re-masks on every mount. A copy button
  next to it is a nice touch and reuses the clipboard pattern from
  `SocialSection.tsx:78-87`.
- **Password row.** Nine bullet characters, `tabular`, `text-fg-muted`, with **no
  reveal control**, and one line of honest explanation underneath in
  `text-xs text-fg-subtle`: *"Your password is stored as a one-way hash — even
  Mettle can't read it back. Change it below if you've forgotten it."* That
  sentence is doing real work; do not trim it to save space.
- **Change password.** Opens a `Sheet` with a new-password field plus a confirm
  field, minimum eight characters, and calls the existing
  `useAuth.updatePassword` (`useAuth.ts:168-174`). On success, toast *"Password
  changed"*; on failure, show `res.message` inline in `text-danger`, matching how
  `SocialSection` surfaces errors (`SocialSection.tsx:142`).
- **Send a reset email.** Calls `useAuth.resetPassword(email)`
  (`useAuth.ts:157-166`) and toasts its returned message. Note that function
  deliberately returns the same string whether or not the address has an account —
  there is a comment explaining it is otherwise an account-existence oracle.
  Do not "improve" that by reporting the real outcome.

Sign-out already lives in Settings → Backup and sync (`SyncSection.tsx:131`).
Leave it there; do not duplicate it.

**Acceptance criteria.** Signed in, the You screen shows an Account card with a
masked email that reveals on tap and re-masks on navigation away and back. The
password row never reveals anything. Changing the password works and the new one
signs you in after a sign-out. Signed out, the card is absent entirely.

### D12 — A FAQ in Settings → About that actually takes you somewhere

*User's words: "Add an FAQ on about in settings that navigate you to the certain
specifics of a problem."*

The second half is the whole point. A FAQ that only explains is a wall of text; a
FAQ where every answer ends in a button that puts you on the exact screen is a
support system.

**What exists today.** `Settings.tsx:311-342` renders the About section: the
wordmark, tagline, version line, a "What's new" button, and an install card. The
navigation mechanism you need already exists — `useUI.navigate(screen, params)`
(`useUI.ts:72-78`), with settings sections addressed as
`navigate('settings', { section: 'social' })` (see `Friends.tsx:232-241`), and a
`params.focus` convention for scrolling to a specific card, used by
`Achievements.tsx:32-39` when the unlock toast sends you there.

**What to build.**

*Data.* `src/data/faq.ts`:

```ts
export interface FaqEntry {
  id: string;
  q: string;
  /** Plain prose. Two or three sentences. Voice per Part 2.7. */
  a: string;
  /** Search hits on these too, so "backup" finds the sync answer. */
  keywords?: string[];
  /** Where the fix lives. Omit for purely informational entries. */
  go?: { label: string; screen: ScreenId; params?: Record<string, unknown> };
}
```

Write about twenty entries covering the questions this app actually generates:

- How do I back up my data? → Settings → Data
- How do I move to a new phone? → Settings → Data (export, then import)
- Why isn't my streak going up? — explain the two rest-day freezes per Mon–Sun
  week, which is genuinely non-obvious → You (Consistency)
- How do I add a friend? → Friends
- Who can see my workouts? → Settings → Friends and privacy
- Are my physique photos private? — yes, per-photo, private unless shared → You
- How do I change my split? → Split
- How do I make my own exercise? — type a name in the picker → Train
- What does the F button mean? — to failure
- Why does it suggest a weight? — last performance plus a small increment
- How do I turn off sounds / haptics? → Settings → Feel
- How do I install it on my home screen? → Settings → About
- I forgot my password → You (Account)
- How do I hide tabs I don't use? → Settings → Appearance
- What is the Playbook? → Learn
- How do I log cardio? — minutes and distance, not weight and reps
- How do I log an injury so it suggests easier lifts? → Settings → You (this one
  only makes sense after F20 ships; add it then)

*UI.* A `Card` in the About section above the version card, titled "Questions".
A search input filtering on question, answer and keywords. Entries render as an
accordion — tapping expands the answer with a `height`/`opacity` transition. Each
expanded answer ends with the `go` button in `text-accent` that calls
`navigate(...)` and closes the settings screen. Collapse other entries when one
opens; a fully expanded twenty-entry list is the wall of text you are avoiding.

Empty search state: *"No answer for that yet."* Nothing cute.

**Acceptance criteria.** Settings → About shows a searchable Questions card.
Typing "backup" surfaces the export answer. Tapping its button lands you on
Settings → Data. Every entry with a `go` navigates somewhere that exists.

### D13 — "Lifter wants to be friends"

*User's words: "Still says «lifter» wants to be friends."*

**Diagnose before you patch.** This is a bug that was already supposedly fixed —
`src/data/releaseNotes.ts:42` lists *"Friend requests showed 'Lifter' instead of
the person's actual name and photo"* under fixes. So something about the fix is
not working in the deployed environment, and patching the display string without
finding out why will leave the real fault in place.

Here is the actual chain, in `src/lib/social.ts:319-356`:

1. `fetchRequests` collects the other party's user id for each pending request.
2. It calls the RPC `supabase.rpc('pending_request_profiles')` — a
   security-definer function that returns `uid`, `name`, `avatar` for people in a
   request relationship with the caller. It exists in
   `supabase/migrations/0007_fixes.sql:46`.
3. Anyone the RPC did not cover is looked up directly in `shared_profiles` —
   which only works for people who are *already friends*, because of the row
   level security policy.
4. Anything still unresolved falls back to the literal string `'Lifter'`.

**The most likely cause, by a distance: migration `0007_fixes.sql` has not been
applied to the live Supabase project.** The code shipped; the SQL may not have.
Check that first.

Your investigation steps, in order:

1. In `fetchRequests`, the RPC result is destructured as
   `const { data: pending } = await supabase.rpc(...)` — **the error is
   discarded.** Capture it and `console.warn` it. Then open the app with a real
   pending request and read the console. A missing function returns a clear
   PostgREST error (`function public.pending_request_profiles() does not exist`),
   which settles the question in one run.
2. If it is missing, tell the user to apply migration 0007 to their Supabase
   project — reference `docs/DEPLOY.md` — and confirm the fix.
3. If the RPC *is* present and returning rows, check whether the requester simply
   has no `display_name` yet. `ensureSharedProfile` creates the row before the
   name is set, so someone who signed up, sent a request, and never finished
   `ProfileSetup` genuinely has a null name. That is a different bug and needs a
   different fix: block sending a request until a display name exists (in
   `AddFriendSheet.tsx`), which is the honest solution.

**Regardless of the cause, improve the fallback.** `'Lifter'` reads like a real
name, which is exactly why it is confusing. There are four literal `'Lifter'`
fallbacks in `social.ts` (lines 61, 299, 342, 353) plus more in
`notifications.ts:42`, `FriendActivity.tsx:87`, `CommentsSheet.tsx:96` and
`PhysiqueBoard.tsx:48-50`. Introduce one shared constant and use it everywhere —
something that cannot be mistaken for a name, such as `'Someone'`, and in the
friend-request row specifically, render *"Someone wants to be friends"* with the
share-code initial in the avatar rather than a person's initial.

**Acceptance criteria.** You have reported to the user *why* it said "Lifter",
with evidence from the logged RPC error. If it was the missing migration, they
have been told to apply it. The literal `'Lifter'` no longer appears anywhere in
`src/`.

### D14 — A final warning before unfriending

*User's words: "On the are you sure if u want to un friend add a final warning."*

**What exists today.** `FriendProfile.tsx:372-394` opens a sheet titled "Remove
friend?" with genuinely good copy explaining what they will lose, and two
buttons: Keep, and Remove. Remove fires immediately.

**What to build.** Add the second gate using the app's established two-tap
pattern (Part 2.5), so the Remove button inside the sheet arms rather than fires:

```tsx
<Button
  variant="danger"
  fullWidth
  onClick={() => {
    if (!confirmFinal) {
      setConfirmFinal(true);
      haptics.warn();
      setTimeout(() => setConfirmFinal(false), 4000);
      return;
    }
    haptics.warn();
    setConfirmRemove(false);
    void unfriend(friendId).then(onBack);
  }}
>
  {confirmFinal ? 'Tap again — this removes them' : <><UserMinus size={16} /> Remove</>}
</Button>
```

Reset `confirmFinal` to `false` in the sheet's `onClose` so reopening never starts
armed. Four seconds rather than three, matching the physique-photo destructive
actions (`MyPhysique.tsx:170`, `:205`) — the ones that touch other people get the
longer window.

Raise a toast after the removal completes: *"Removed Sam"*, `tone: 'danger'`. No
undo here; the friendship row is gone from the database and re-adding requires
their consent.

**Acceptance criteria.** Opening the remove sheet and tapping Remove changes the
label instead of removing. Tapping again removes and returns you to the friends
list with a toast. Closing and reopening the sheet resets the arm.

### D15 — See the photos you posted

*User's words: "View photos you posted."*

**What exists today.** `MyPhysique.tsx:75-117` renders your check-ins as a
three-column grid of thumbnails. Tapping one opens an **actions** sheet — share,
make private, delete — and never the photo itself. There is a comment explaining
the design choice, and it is a good one:

> Never toggle visibility straight from a tap — a mis-tap in a grid would publish
> a photo of your body.

So the fix is not "make tap open the photo." It is to add viewing as a first
option inside the sheet, and a filter for finding the shared ones.

**What to build.**

1. **A full-size viewer.** `FriendProfile.tsx:396-418` already has exactly this:
   a `Sheet` titled with `prettyDate(takenOn)`, an `<img>` at
   `max-h-[60vh] object-contain rounded-card bg-surface-2`, a spinner while the
   signed URL resolves, and the pose and caption underneath. Copy that shape. The
   grid currently signs only `thumbPath` (`MyPhysique.tsx:35`); you need the
   full-size path signed on demand — `useSignedUrls` in
   `src/features/physique/useSignedUrls.ts` is the hook, and `FriendProfile` shows
   the pattern of holding a second signed-URL map for full images.
2. **A "View photo" button** at the top of the existing action sheet, above the
   share and delete buttons, so the destructive options stay where they are and
   nobody's muscle memory breaks.
3. **A filter.** Above the grid, a `Segmented` with `All` / `Shared` / `Private`,
   defaulting to All. This is the "photos you posted" half of the request read
   literally — the user wants to see what is currently public. The lock and
   people badges are already rendered per tile (`MyPhysique.tsx:104-110`), so the
   data is there; you are filtering on `p.visibility`.
4. When the Shared filter is active and there are none, an honest empty line:
   *"You haven't shared any check-ins yet."*

**Acceptance criteria.** Tapping a check-in opens the action sheet with View photo
first; tapping that shows the full image with its date, pose and caption. The
Shared filter shows only photos on the friends board. No tap anywhere in the grid
changes a photo's visibility.

---

## Phase E — Progress and consistency

### E16 — Give the streak flame a real fire

*User's words: "give the streak flame a moving lit animation."*

**What exists today.** `Dashboard.tsx:96-103` puts a static lucide `<Flame />`
inside a circle and scales the whole circle between 1 and 1.07 on a 2.4s loop.
It pulses; it does not burn. The same static flame appears at
`Friends.tsx:332-337` (each friend's streak) and `FriendProfile.tsx:184-190`.

**What to build.** `src/features/you/StreakFlame.tsx` — a hand-drawn inline SVG
flame that flickers, exported with a `size` prop so all three call sites share it.

Construction that reads as fire rather than as a wobbling icon:

- **Three stacked layers**, back to front: an outer body at `var(--accent)` with
  around 45% opacity, a mid body at full `var(--accent)`, and an inner core in
  `color-mix(in srgb, var(--accent) 30%, white)`. Real flames are brightest and
  palest at the centre; a single-color flame always looks like a sticker.
- **Independent flicker per layer.** Give each a looping `animate` with a
  different duration — say 1.7s, 2.3s and 1.1s — and slightly different keyframes
  on `scaleY` (1 → 1.08 → 0.96 → 1), `scaleX` (1 → 0.94 → 1.03 → 1), and a small
  `rotate` of a degree or two. Set `transformOrigin: 'center bottom'` on all
  three so they lick upward from the base instead of pivoting around their
  middle. Because the durations are coprime-ish, the layers drift in and out of
  phase and the loop never reads as a loop. That desynchronisation is the entire
  trick — do not give them the same duration.
- **Ember glow.** Behind the flame, an absolutely positioned radial gradient in
  `var(--accent-soft)` animating opacity between about 0.5 and 0.9 on a slow
  3.5s cycle, blurred. The `ambientGlow` preset in `motion.ts` is close to this
  already — reuse it rather than writing new numbers.
- Optionally, two or three tiny ember dots drifting up and fading out on long
  staggered loops. Only on the large Dashboard instance; at the 16px size used in
  the friends list they would just be noise. Gate that on the `size` prop.

**Constraints.** Color comes from `var(--accent)` only — the flame must recolor
with the user's chosen accent and work on light canvases. Under
`prefersReducedMotion()`, render the layers at rest with the glow static.

Replace all three call sites. On the Dashboard, drop the existing scale pulse on
the surrounding circle — the flame is now doing that job and two pulses at
different rates will fight.

**Acceptance criteria.** The Dashboard streak flame visibly flickers with no
detectable loop point. Changing the accent in Settings → Appearance recolors it.
Friend rows show the same flame, smaller and calmer. Reduced motion stills it.

### E17 — Tap a week on the consistency chart

*User's words: "Press on individual weeks on consistancy which lights it up and
shows more info on that specific week."*

**What exists today.** `WeeklyTowers` (`Consistency.tsx:44-81`) renders twelve
Mon–Sun bars, height proportional to days trained, with a native `title` tooltip
that does nothing useful on a phone. `weeklyTowers()` in
`src/lib/formulas.ts:219-233` supplies `{ weekStart, days, label, isCurrent }`
per bar.

**What to build.** Make each tower a real button and add a detail panel.

*The bars.* Wrap each in a `<button>` with an `aria-label` like
`"Week of 18 Aug, 4 days trained"`. Track `selectedWeek: string | null` in
`Consistency`. The selected bar gets the lit treatment: full
`bg-accent bg-accent-grad` regardless of whether it is the current week, plus a
stronger glow — bump the existing `boxShadow` from a 40% mix at 8px to something
like 70% at 14px. Unselected bars drop to about 45% opacity so the selection
genuinely reads. Tapping the selected bar again clears the selection.

*The detail panel.* Below the chart, an `AnimatePresence` block that expands when
a week is selected. Compute everything from `history` (newest-first) filtered to
that week's Monday through Sunday — `startOfWeek` and `addDays` from
`src/lib/date.ts` give you the bounds, and `Dashboard.tsx:64-69` shows the exact
idiom for a week-bounded filter.

Show:

- The week's date range as a heading: *"18–24 Aug"*.
- Days trained out of the weekly goal if one exists — the frequency goal is
  already read at `Consistency.tsx:91`.
- Total volume, via `sessionVolume()` from `formulas.ts`, converted with
  `fromKg()` and labelled with `unitLabel(units)`. Never show raw kilograms to a
  pounds user.
- Total sets.
- Any PRs set that week, from the `prs` array filtered on date.
- A compact list of the sessions: date, day name, and duration via the newly
  three-tiered `fmtDuration` from B3. Tapping one could navigate to Progress;
  optional, and only if it lands somewhere useful.
- An empty week says so plainly: *"Nothing logged this week."* — not a blank
  panel.

Use `listItem` from `motion.ts` for the panel entrance so it matches every other
expanding surface in the app.

*Bonus consistency.* `ConsistencyGrid` (the Days view) has the same
tooltip-only problem, and `WeeklyTowers` is also rendered on friend profiles.
Keep the selection logic in the `Consistency` component and pass
`selected`/`onSelect` into `WeeklyTowers` as optional props, so the friend-profile
instance can stay read-only rather than inheriting a half-working interaction.

**Acceptance criteria.** Tapping a week lights that bar, dims the rest, and
expands a panel with that week's real numbers. Tapping it again collapses. The
numbers match what the Progress screen reports for the same range. Friend
profiles are unaffected.

### E18 — Save individual days, not just whole splits

*User's words: "Save days (for splits)."*

**What exists today.** `saveCurrentSplit(name)` (`useStore.ts:228-239`) snapshots
**every** day into `savedSplits`, reloadable from Templates → Saved
(`TemplateBrowser.tsx`). It is all-or-nothing. If you build a really good Push
day you cannot keep just that one and reuse it in a different program.

**What to build.** A parallel, smaller concept: saved days.

*Types* (`src/types/index.ts`, next to `SavedSplit`):

```ts
export interface SavedDay {
  id: string;
  name: string;
  savedAt: string;
  exercises: SplitExercise[];
}
```

*Store* (`src/store/useStore.ts`) — remember the four-touch rule from Part 1.3:

- `savedDays: SavedDay[]` in the `AppData` interface
- `savedDays: []` in `initialData`
- `savedDays: s.savedDays` in `partialize`
- and in `exportData`'s payload, so backups carry it

Actions, mirroring the saved-split ones so the file stays symmetrical:

- `saveDay: (dayId: string, name?: string) => void` — snapshots one day from
  `split`, defaulting the name to the day's own name
- `deleteSavedDay: (id: string) => void`
- `addSavedDay: (id: string) => void` — appends it to the current split as a new
  day with a fresh `uid()`. Appending is the only sensible mode here; unlike a
  whole split there is nothing to replace.

No `SCHEMA_VERSION` bump — `merge` gives existing installs the empty array.

*UI in `Split.tsx`.* The day header row (`Split.tsx:184-216`) has grip, name,
pencil, trash. Add a `Bookmark` button between pencil and trash,
`aria-label={"Save " + day.name}`, which saves immediately and toasts
*"Saved Push"* with an action to view it. Immediate rather than opening a naming
sheet: the day already has a name, and the whole-split flow already covers the
"name it something else" case. Fewer taps for the common path.

*UI in `TemplateBrowser.tsx`.* It already has a Saved section for splits
(`TemplateBrowser.tsx:189` renders a `Bookmark` icon). Add a **Saved days**
section alongside it: each row shows the name, the exercise count, and a relative
saved date, with a `+` to add it to the current split and a trash to delete it.
Reuse the existing row styling rather than inventing a new card shape.

**Acceptance criteria.** Bookmarking a day saves just that day. Templates → Saved
shows a Saved days list. Adding one appends it to the current split without
touching the other days. Exporting and re-importing a backup preserves saved days.
Reloading the app preserves them.

---

## Phase F — Teaching the app

Two genuinely new subsystems. Budget accordingly: these are not afternoon items.

### F19 — An interactive tutorial, twice

*User's words, two requests that are really one feature: "An onscreen tutorial
that guides you how to correctly use the app while training and how to properly
log the first time your loading up you're first lift" and "When first making an
account it should be an interactive tutorial navigating on how to properly use
the app."*

**What exists today.** `Onboarding.tsx` is a six-step full-screen setup flow
(welcome, install, quiz, units, profile, template) that ends with
`completeOnboarding()` (`:48-60`) flipping `settings.onboarded`. It configures the
app but never shows you how to use it. After it, you are dropped on the Dashboard
cold. And the first time you open the logger, six controls appear — weight,
reps, the F toggle, the tick, Add set, Finish — with no explanation of which
matters.

**What to build.** One spotlight engine, two step lists.

*The engine.* `src/features/system/CoachMarks.tsx`, plus a small
`src/lib/coachMarks.ts` for the step type.

```ts
export interface CoachStep {
  /** Stable id, used for the React key and for debugging. */
  id: string;
  /** CSS selector or a data attribute value identifying the target. */
  target: string;
  title: string;
  body: string;
  /** Where the bubble sits relative to the target. Default 'auto'. */
  place?: 'above' | 'below' | 'auto';
  /** Run before the step shows — e.g. navigate to the right screen. */
  before?: () => void;
}
```

Mark targets in the JSX with a data attribute — `data-coach="train-weight"` — and
select on that. Do not select on Tailwind class names; they change.

Rendering:

- A portal to `document.body`, `z-[65]` (above sheets, below the celebration).
- Measure the target with `getBoundingClientRect()` on each step, and re-measure
  on `resize` and `scroll`. Scroll the target into view first with
  `scrollIntoView({ block: 'center', behavior: 'smooth' })` and wait a beat before
  measuring, or the cut-out lands where the element used to be.
- The dim + cut-out is easiest as **four absolutely positioned panels** — above,
  below, left, right of the target rect — each `bg-black/70`, leaving the target
  visible through the gap. This beats an SVG mask for taps: the panels swallow
  clicks, the hole does not, so the user can actually press the thing you are
  pointing at. Put a `rounded-btn` accent ring around the hole using a
  `box-shadow` spread on a transparent div.
- A caption bubble in `bg-elevated` with `shadow-pop`, containing the title, the
  body, a `2 of 6` counter, a Skip button and a Next button. Position it above or
  below the target depending on which half of the viewport the target is in, and
  clamp it to the viewport with a margin so it never runs off an edge.
- `Escape` and the Skip button both end the tour. Skipping is always available —
  a tutorial you cannot leave is a hostage situation.
- Entrance uses `springPop`; the cut-out animates between steps by transitioning
  the panel positions, which reads as the spotlight sliding. Under
  `prefersReducedMotion()`, cut instead.
- Call `useUI.pushOverlay()` / `popOverlay()` while active, like `Sheet` does, so
  swipe-nav is suppressed.

*Persistence.* Add `toursSeen: string[]` to `Settings` in `src/types/index.ts`,
defaulted to `[]` in `initialData`. It rides along in `settings`, which is already
in `partialize`, so no other plumbing is needed. A tour marks itself seen when
completed **or skipped** — replaying it against someone's will is worse than them
missing it.

*Tour one: the welcome tour.* Id `welcome`. Fires once, right after
`completeOnboarding()`. Five or six steps walking the bottom nav:

1. The Home tab — "Your day at a glance: streak, what's next, and how the week is
   going."
2. The Split tab — "Your training days live here. Build them once, reuse them
   forever."
3. The Train tab — "Pick a day, hit Start, and log as you go."
4. The You tab — "Body weight, goals, photos and your consistency."
5. The settings cog — "Themes, units, privacy and a FAQ if you get stuck."

Each step's `before` navigates to that tab so the user sees the real screen
underneath the spotlight, not an abstraction. That is what makes it *interactive*
rather than a slideshow, which is what the user asked for.

*Tour two: the first-lift tour.* Id `first-lift`. Fires when the logger renders
with an active session **and** `history.length === 0` — genuinely their first
workout, not merely their first time on the tab. Six steps, pointing at real
controls in `Train.tsx`:

1. The weight field — "Type the weight. The faded number is a suggestion based on
   last time."
2. The reps field — "How many you got. Leave it and tap the tick to accept the
   suggestion."
3. The F button — "Tap F when you took the set to failure. Then log the reps you
   actually hit."
4. The tick — "This logs the set and starts your rest timer."
5. Add set — "Need another? Add as many as you like."
6. Finish workout — "When you're done, this saves it and shows you what you did."

Then offer a **Replay tutorial** row in Settings → About beside the FAQ, listing
both tours, which clears the id from `toursSeen` and re-runs it.

**Acceptance criteria.** A fresh install (clear `localStorage`) runs onboarding,
then the welcome tour, which actually moves between tabs. Starting the very first
workout runs the first-lift tour, whose spotlights sit correctly over the real
controls and let you tap them. Neither replays on a second launch. Both can be
replayed from Settings → About. Skip works at any point.

### F20 — Injury-aware exercise recommendations

*User's words: "Note the app what problems/injuries you have and it can
reccommend exercises that put least amount of strain on «injury/unwanted area»
like for example a pulldown without much shoulder activation/strain."*

The biggest item in the release, and the one with the highest chance of being
built badly. Read all of it before starting.

**Framing rule, non-negotiable.** This is **training-load guidance, not medical
advice.** The app must never diagnose, never tell someone an injury is or is not
serious, and never imply it knows their condition. What it legitimately does is
mechanical: some movements load a joint through more range, under more stretch,
at a worse angle, than others — and it can rank them on that. Write every string
in that register.

- Good: *"Loads the shoulder overhead, at end range."*
- Good: *"Same lats, less shoulder."*
- Bad: *"Avoid this — it will worsen your injury."*
- Bad: *"Safe for shoulder pain."*

One disclaimer, once, where the user sets their areas: *"This adjusts what Mettle
suggests, based on how movements load a joint. It isn't medical advice — if
something hurts, see a professional."* One line. No repeated warnings, no red
banners, no fear.

**The architecture, and why.** `src/data/muscleMap.ts` already solves the hard
version of this problem for muscle regions, and its header comment explains the
reasoning you should copy wholesale:

> Rather than hand-maintaining a 112-entry table that goes stale the moment
> someone adds a custom exercise, regions are resolved by ordered pattern rules
> with a small override table for the handful the rules misread. That covers
> custom movements and a friend's imported ones for free.

Build the injury layer the same way. A lookup table keyed on exercise name would
be dead the first time someone adds "Cable Y-Raise" as a custom.

*Data: `src/data/injuries.ts`.*

```ts
export type InjuryArea =
  | 'shoulder' | 'lower-back' | 'knee' | 'elbow' | 'wrist' | 'hip' | 'neck';

export interface InjuryDef {
  id: InjuryArea;
  label: string;          // "Shoulder"
  /** Shown when picking, so the list is self-explanatory. */
  hint: string;           // "Overhead pressing, deep stretch on the chest"
}

/** 0 = negligible, 1 = moderate, 2 = high. Fractional values are fine. */
export type StrainScores = Partial<Record<InjuryArea, number>>;

interface StrainRule {
  test: RegExp;
  group?: MuscleGroup | MuscleGroup[];
  scores: StrainScores;
  /** One clause, lowercase, no full stop — rendered after the exercise name. */
  reason: string;
}
```

Then `RULES: StrainRule[]`, ordered most-specific to most-generic, first match
wins — exactly the shape of `muscleMap.ts:79-122`. Sketch of the content you need
(extend it; this is the shape, not the whole table):

- `/behind-the-neck|upright row/` → shoulder 2 — *"forces internal rotation
  under load"*
- `/overhead press|military|arnold/` → shoulder 1.5, lower-back 0.5 —
  *"loads the shoulder overhead, at end range"*
- `/dip/` → shoulder 1.5, elbow 1 — *"deep stretch at the bottom"*
- `/bench press/` with group Chest → shoulder 1, wrist 0.5
- `/lateral raise/` → shoulder 1 — *"long lever at the top"*
- `/face pull|rear delt/` → shoulder 0.25 — *"short range, low load"*
- `/pulldown|pull-?up|chin-?up/` → shoulder 0.5, elbow 0.5
- `/straight-arm pulldown/` → shoulder 0.75 — *"long lever overhead"*
- `/deadlift|good morning|bent-over|pendlay/` → lower-back 2, hip 1 —
  *"loads the spine under a hinge"*
- `/back extension|hyperextension/` → lower-back 1.5
- `/squat|leg press|hack squat/` → knee 1.5, lower-back 1, hip 1
- `/lunge|split squat|step-?up|pistol/` → knee 1.5, hip 0.75
- `/leg extension|sissy/` → knee 1.5 — *"shear at the knee under load"*
- `/leg curl|romanian|nordic/` → knee 0.25, lower-back 0.75
- `/hip thrust|glute bridge/` → knee 0.25, lower-back 0.5
- `/skull|overhead triceps|jm press/` → elbow 1.5 — *"stretched-position elbow
  load"*
- `/curl/` → elbow 0.75, wrist 0.5
- `/wrist curl|reverse curl/` → wrist 1.5
- `/front squat|zercher/` → wrist 1, knee 1
- `/shrug|farmer|carry/` → neck 1, wrist 0.5
- `/plank|ab wheel|hanging leg raise/` → lower-back 0.5, shoulder 0.5
- `/machine|chest-supported|seated cable|pec deck|cable/` → a **negative
  modifier** where sensible, or simply lower scores — supported movements are the
  ones you are steering people toward

Plus an `OVERRIDES` table for the handful the patterns misread — the same escape
hatch `muscleMap.ts:125-134` has.

*Logic: `src/lib/injuryAnalysis.ts`.*

- `strainFor(name: string, group?: MuscleGroup): { scores: StrainScores; reason: string }`
  — memoised in a module-level `Map`, exactly like `regionsFor`
  (`muscleMap.ts:184-194`). No match returns empty scores, which correctly means
  "we have nothing to say about this," not "this is safe."
- `worstStrain(name, group, injuries: InjuryArea[]): number` — the highest score
  across the user's declared areas. This is what the UI sorts and badges on.
- `gentlerAlternatives(name, group, injuries, customExercises): string[]` — the
  good part. Resolve the movement's primary region with `regionsFor()`, find other
  exercises in `EXERCISE_LIBRARY` plus customs that share that primary region,
  keep those with a strictly lower `worstStrain`, and return the best two or three
  sorted by strain ascending then by region overlap descending. `FIX_EXERCISES`
  (`muscleMap.ts:197-218`) is a useful seed list of primary-target movements.

This is precisely the user's own example: for someone with a shoulder problem,
Lat Pulldown resolves to `lats` primary; the alternatives that also hit `lats`
with less shoulder load are Chest-Supported Row and Straight-Arm Pulldown — and
the app can say so without anyone hand-writing that pair.

*Storage.* Add to `Profile` in `src/types/index.ts`:

```ts
/** Areas the user has told us to work around. Drives exercise suggestions —
 *  see src/lib/injuryAnalysis.ts. Not medical data, and never published to
 *  the social layer. */
injuries: InjuryArea[];
```

Default `[]` in `initialData.profile`. `profile` is already spread explicitly in
`merge` (`useStore.ts:525`) and listed in `partialize`, so existing installs pick
up the default cleanly. **Do not add it to anything in `src/lib/social.ts`.**
Health information does not go on a shared profile, and nobody asked for it to.

*UI, part one: setting it.* In `ProfileSection.tsx` (Settings → You), a new `Card`
below the About-you card:

- `CardLabel` "Working around an injury?"
- One line of explanation, then the disclaimer sentence above.
- The seven areas as toggle chips, styled exactly like the existing Activity chips
  (`ProfileSection.tsx:85-98`) — same `px-3 h-9 rounded-full`, same selected and
  unselected treatments. Multi-select. `haptics.select()` on tap.
- Each chip's `hint` shown when selected, so the list teaches itself.
- When at least one is selected, a summary line: *"Mettle will flag movements that
  load your shoulder and suggest gentler options."*

*UI, part two: using it, in `ExercisePicker.tsx`.* This is where it pays off.

- **A filter chip.** The group chips row (`ExercisePicker.tsx:92-110`) gains a
  leading toggle when `profile.injuries.length > 0`, labelled from the areas —
  *"Kind on my shoulder"* for one, *"Kind on my joints"* for several. Active, it
  filters out anything with `worstStrain >= 1.5` and sorts the rest ascending by
  strain. Style it distinctly from the group chips — those are exclusive, this one
  is an independent toggle — perhaps `border-warning/50 text-warning` when off and
  filled when on.
- **Per-row badges.** For flagged exercises, a small pill after the group label:
  amber `bg-warning/15 text-warning` at strain 1 to 1.5, red-tinted
  `bg-danger/15 text-danger` above that. The pill's text is the rule's `reason`,
  truncated, with the full string as the `title`. Never hide the exercise
  outright — the user is an adult and may have a reason.
- **Gentler options.** When a flagged exercise is tapped, do not block it. Add it,
  and raise a toast: *"Added. Gentler options: Chest-Supported Row, Straight-Arm
  Pulldown"* with an action that reopens the picker filtered to those. Suggesting
  after the fact respects the choice while still offering the help.
- In **replace mode** (B5), sort the "Similar movements" shortlist by ascending
  strain when injuries are set. This is the single highest-value integration in
  the whole feature: the user is already asking for a substitute at the exact
  moment the app knows which substitutes are kinder.

*UI, part three: the FAQ entry.* Add the deferred entry from D12 now that the
feature exists.

**What not to build.** Do not touch the SplitQuiz, the Coach card, or the template
recommendations. The user scoped this to exercise selection, and spreading a
half-confident heuristic across the whole app is how a helpful feature becomes an
annoying one.

**Acceptance criteria.** Selecting Shoulder in Settings → You makes Overhead Press
and Behind-the-Neck Press show a red-tinted badge in the picker, Face Pull show
nothing, and the "Kind on my shoulder" filter hide the worst offenders. Adding a
flagged exercise still works and offers two named alternatives that hit the same
muscle. Custom exercises with recognisable names get scored by the pattern rules.
No injury data appears in any Supabase table. Selecting nothing leaves the picker
exactly as it is today.

---

## Part 4 — Verification and wrap-up

### 4.1 The gates

Both must pass, cleanly, before you say you are done:

```bash
npm run build
```

```bash
npm run lint
```

Remember `build` includes `tsc -b`. If you find yourself adding `any` or
`@ts-expect-error` to get through it, stop and fix the type instead — this
codebase has neither today.

### 4.2 Manual pass

Run `npm run dev` and walk it. Do not trust that it compiles.

**Per phase:**

- **A** — Export a backup, save a split preset. One toast style, one position,
  dismissible.
- **B** — Start a multi-group session. Check group headers and counts, collapse
  one, delete an exercise from the first group and confirm the correct card goes,
  undo it, swap an exercise and confirm its sets survive, and let the clock pass
  an hour.
- **C** — Finish a workout with sharing on, then with it off. Compare.
- **D** — No M tile anywhere. Account card masks and reveals. FAQ search
  navigates. Unfriend needs two taps. A check-in opens full size.
- **E** — Flame flickers. Tap a week, read its numbers, cross-check them against
  Progress. Bookmark a day, reload, confirm it survived.
- **F** — Clear `localStorage` entirely and go through onboarding, the welcome
  tour, and a first workout with the first-lift tour. Then set an injury and open
  the picker.

**Across the board:**

- **Both themes**, and at least one tinted theme. Nothing hardcoded, nothing
  invisible.
- **A 375px viewport.** This is a phone app. Check the toast, the coach-mark
  bubbles, the FAQ accordion and the week detail panel at that width.
- **`prefers-reduced-motion: reduce`** — DevTools → Rendering → Emulate CSS media.
  Every outcome still happens; only the travel is gone.
- **Signed out.** Nothing social should crash or appear. The app is meant to work
  fully offline with no Supabase project at all.
- **A fresh install** (cleared storage) *and* **an upgrade** (v1.2.1 storage blob
  left in place). The upgrade path is the one that catches `partialize` mistakes.

### 4.3 Release notes — do not skip this

`src/data/releaseNotes.ts` is a real, maintained changelog that surfaces in the
"What's new" sheet after an update. Add a `1.3.0` entry at the top, and bump
`version` in `package.json` to `1.3.0`.

Match the voice, which is worth studying — it is written for the user, in prose,
describing the *experience*, not the implementation. Compare the existing entries:

> The app has a pulse now: presses bloom instead of jolting, your streak and next
> workout glow gently at rest, and finishing a set lands with a ring of light.

> Streaks now have rest days built in — two a week, Mon–Sun. Training 4× a week
> keeps your streak instead of breaking it.

Note the structure: `items` for new things, `fixes` for repairs, kept separate
because — per the comment in that file — *"we added" and "we fixed" are different
news*. The "Lifter" fix and the session-clock fix belong under `fixes`. Everything
else is an `item`. Six to eight items is right; do not list all twenty changes
individually, group them the way the existing entries do.

### 4.4 What to report back

When you finish, tell the user:

1. Which of the twenty items are done, in one line each.
2. Anything you skipped or partially delivered, and **why** — do not bury this.
3. The answer to the "Lifter" investigation (D13), with the actual error you saw.
4. Anything you found that contradicts this brief.
5. Any decision you made that they might want to reverse — the wordmark gradient
   (D10), the sound choice on the public-post toast (C9), and where the Account
   card landed on the You screen (D11) are the three most likely.

---

## Part 5 — Quick reference

### UI primitives — `src/components/ui/index.ts`

`Button` (variants: default, accent, outline, ghost, danger; sizes: sm, default,
lg; `fullWidth`) · `Card` · `CardLabel` · `Segmented` · `Switch` · `PageHeader`
(title, subtitle, action, toolbar) · `EmptyState` (icon, title, body, action) ·
`Sheet` (open, onClose, title) · `Stepper` · `CountUp` · `Sortable` · `Pressable`
· `PressableCard`

### Motion — `src/theme/motion.ts`

`spring` · `springPop` · `easeOut` · `cinematic` · `listContainer` / `listItem` ·
`heroContainer` / `heroItem` · `revealBlur` · `tapScale` · `tapCard` ·
`ambientGlow` · `pulseOnce` · (add) `prefersReducedMotion()`

### Sound — `src/lib/sound.ts`

`sfxPop` · `sfxSetDone` · `sfxFanfare` · `sfxSessionStart` · `sfxAchievement` ·
`sfxNotify` · `sfxCountdownTick` · `sfxSparkle` · `playChime` · (add) `sfxWoosh`

### Haptics — `src/lib/haptics.ts`

`haptics.tap()` · `haptics.select()` · `haptics.success()` · `haptics.warn()`

### Color tokens — `src/index.css`

`canvas` · `surface` · `surface-2` · `surface-3` · `elevated` · `border` ·
`border-strong` · `fg` · `fg-muted` · `fg-subtle` · `accent` · `accent-fg` ·
`accent-soft` · `success` · `danger` · `warning`
Plus raw vars: `--accent-grad` · `--accent-glow` · `--edge-highlight` · `--sheen`
Radii: `rounded-card` · `rounded-btn`. Shadows: `shadow-card` · `shadow-pop` ·
`shadow-hero` · `shadow-float`.

### Domain helpers you will need

| Need | Where |
| --- | --- |
| Merge classes | `cn()` — `src/lib/cn.ts` |
| Generate an id | `uid()` — `src/lib/id.ts` |
| Local ISO date, week maths | `todayStr`, `startOfWeek`, `addDays`, `daysBetween`, `prettyDate`, `fmtDuration` — `src/lib/date.ts` |
| Units | `fmtWeight`, `fromKg`, `toKg`, `unitLabel`, `loadIncrement`, `paceLabel` — `src/lib/units.ts` |
| Streak, volume, stalls, weeks | `streakInfo`, `sessionVolume`, `stalledExercises`, `weeklyTowers`, `consistency` — `src/lib/formulas.ts` |
| Muscle regions from a name | `regionsFor`, `resolveRegions`, `REGIONS`, `FIX_EXERCISES` — `src/data/muscleMap.ts` |
| Last performance, next weight | `lastPerformance`, `suggestNextKg` — `src/lib/training.ts` |
| Signed storage URLs | `useSignedUrls` — `src/features/physique/useSignedUrls.ts` |
| Navigate, overlays, toasts | `useUI` — `src/store/useUI.ts` |

---

## Closing note

Twenty items, six phases. The user described the goal as giving the app life.
The two changes that will actually deliver that feeling are the **send-off** (C7,
C8) and the **flame** (E16) — everything else is the app getting out of its own
way, which matters just as much but is invisible when done right.

Build them in order. Check in between phases. When something in here turns out to
be wrong about the code, trust the code and say so.
