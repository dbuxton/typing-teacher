# Typing Teacher

A touch-typing tutor for a kid who's just starting out (roughly ages 7–9), which
sneaks in spelling practice along the way. Runs entirely in the browser — no
server, no accounts, no network. Progress is saved in the browser on that
computer.

```bash
npm install
npm run dev          # http://localhost:5173/typing-teacher/
```

## What makes it different

**Eyes on the screen comes first.** The habit a beginner forms in their first few
weeks is the one they keep, and hunt-and-peck is horrible to unlearn. So:

- The **on-screen keyboard sits right under the text** — a short glance down the
  screen instead of a look at their hands. Keys are tinted by finger, and the
  hands diagram lights the matching finger in the same colour, so the mapping is
  learned as "orange finger, orange key".
- **The keyboard fades as they improve.** Four steps — lettered keys → blank
  colour-coded keys → keyboard only after a slip → no keyboard at all. It moves
  up automatically after a run of accurate lessons, and never moves back down as
  a punishment (if they're struggling mid-lesson, help just reappears).
- **Sneaky Stars.** Every so often a star drifts across the text for a moment.
  Press `↑` while it's there and you bank bonus coins. A kid watching their
  fingers misses every one; a kid watching the screen catches most. It turns
  "look up" from nagging into a game with a score.
- **Star ratings are 50% accuracy, 30% Sneaky Stars, 20% speed.** A careful,
  screen-watching, slow kid can get three stars. A fast, sloppy, peeking one
  can't. That's deliberate, it's the whole pedagogy, and it lives in one function
  (`src/engine/scoring.ts`) if you want to retune it.

**Drills are the warm-up, not the workout.** Two short drill items per lesson,
then real words and sentences. Levels 1–2 are unavoidably drill-heavy (there are
no words in "f j"), so they're short — the aim is to reach real words in the
first session, because that's the session that decides if there's a second one.

**Spelling is woven in.** From level 4, a couple of items per lesson are Spelling
Stars: a commonly misspelled word appears with a sentence for context, hides, and
the kid types it from memory. Words they get wrong come back sooner (Leitner
spaced repetition, `src/engine/srs.ts`), so it targets *their* weak words rather
than working through a fixed list. British spellings by default.

**Rewards that accumulate.** Coins, a daily streak, 20 badges, and a garden that
grows one stage per lesson. Nothing wilts, nothing dies, nothing nags — skip a
fortnight and the garden is exactly as you left it.

### The one thing the app can't do

A browser can't see where a kid is looking. The single most effective trick is
physical: **drape a tea towel over their hands** for the first few weeks. The app
handles the rest.

## Anti-frustration rules

No countdown timers. Backspace always works. Mistakes are amber, never a red X.
Copy says "nearly" and "good effort", never "wrong". Lessons run about two
minutes. Nothing is ever taken away once earned.

If Sneaky Stars turn out to annoy your particular kid, there's a checkbox on the
lesson map to switch them off.

## Layout

```
src/
  data/      curriculum.ts (12 levels), spellingWords.ts, badges.ts, plants.ts
  engine/    pure logic, all unit-tested — generator, scoring, srs,
             sneakyStars, assist, keymap, and the useTypingSession hook
  store/     schema.ts (versioned save + migrations), profileStore.ts (zustand)
  components/ Keyboard, Hands, TypingArea, SpellingCard, SneakyStar, Chrome
  screens/   Home, LessonMap, Lesson, Results, GardenScreen, BadgeShelf
```

The curriculum is data, not code. A level lists the keys it unlocks plus words
and sentences built only from keys taught so far, and the test suite enforces
that — a word using a letter the kid hasn't met yet fails the build. (It caught
"they" sitting two levels before `h` is taught, and `because` five levels before
`b`.)

## Commands

```bash
npm run dev        # dev server
npm run build      # type-check + static build into dist/
npm test           # engine unit tests (vitest)
npm run e2e        # browser smoke tests (playwright)
npm run preview -- --port 4173   # serve the built app
```

`npm run e2e` downloads a browser on first run. If you already have one, point
at it instead: `PLAYWRIGHT_CHROMIUM_PATH=/path/to/chrome npm run e2e`.

## Deploying to GitHub Pages

`.github/workflows/deploy.yml` builds and publishes on every push to `main`. It
needs one manual step, once: **Settings → Pages → Source → GitHub Actions**.

The site is served from a sub-path, so `vite.config.ts` sets
`base: '/typing-teacher/'`. If you fork this under a different repository name,
change that to match or the assets 404.

## Saved progress

Everything lives in `localStorage` under `typing-teacher.save.v1`, keyed by
player, so several kids can share one computer with separate gardens. The save is
versioned with a migration hook (`src/store/schema.ts`), so future changes to the
data model won't wipe anyone's progress. Clearing site data clears the lot —
there's no backup, because there's no server.
