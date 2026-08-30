# Working on Mettle

## Autonomy

**Do not stop to check in between phases or items.** When given a multi-item brief
(e.g. `PROMPT-v1.3.md`), work through the whole thing and report once at the end.
Only stop early for:

- a genuine blocker that makes the remaining work impossible or wrong
- something destructive or irreversible that was not clearly asked for
- a decision where proceeding on the wrong assumption would waste substantial work

Otherwise: make the call, note it in the final report, and keep moving. If one item
turns out to be blocked, skip it, finish everything else, and say what was skipped
and why.

## Reporting

The user checks the **live** site. When work is in an unmerged PR, always give the
Netlify deploy-preview URL (`https://deploy-preview-<PR>--mettlegym.netlify.app`) and
say where in the app to look — the screen and the interaction. Never assume a refresh
of `mettlegym.netlify.app` will show unmerged work.

## House style

`PROMPT-v1.3.md` Part 2 is the contract. In short: comments explain *why* in prose,
colours come from tokens in `src/index.css` (never hex), motion presets live in
`src/theme/motion.ts`, sound is synthesised in `src/lib/sound.ts` (never an audio
file), destructive actions use the two-tap confirm pattern, and every icon-only
button gets an `aria-label`.

Motion rule of thumb, learned the hard way in #9: animate on **events**, not at rest.
One thing moves at a time. Contained transforms only — nothing that shifts layout.

## Gates

`npm run build` (includes `tsc -b`) and `npm run lint` must both pass before reporting
done.
