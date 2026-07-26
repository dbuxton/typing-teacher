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

**It adapts to the kid.** Two things pull against each other, and the app tries to
hold both: get them to their real level *fast*, and never push them past what they
can manage.

- **Auto-acceleration.** A child who already knows the home row shouldn't grind
  through six lessons of "fjf jfj". Ace a lesson and you jump up to three levels at
  once. What's measured is accuracy on the keys the level actually *teaches*, not
  overall accuracy — easy filler words from earlier levels can't carry anyone
  upward.
- **Nothing advances on a fluke.** Progression runs off a rolling average, so one
  lucky lesson doesn't promote a kid into material they can't handle, and one bad
  day doesn't undo their progress either.
- **Lessons get gentler when they're struggling.** Fewer items, shorter words, no
  sentence, fewer Spelling Stars. In the first version every lesson was identical
  and a struggling kid simply failed to unlock, over and over, which is
  demoralising in a way that's easy to miss from the code.
- **Help comes back.** If accuracy stays low the keyboard steps back in, and the app
  *offers* an easier level — as an offer, with "no, stay here" right beside it.
- **Speed is personal.** Three stars is measured against the kid's own recent best,
  never a fixed words-per-minute, so it stays reachable at 7 and still means
  something at 9.
- **No dead ends.** Stuck on a key you can't find? After a few tries, "press → to
  skip". Can't make out a spoken word? "Show me". A kid is never trapped.

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

**Spelling is woven in, and it's a real spelling test.** From level 4, a couple of
items per lesson are Spelling Stars. The first time a kid meets a word it's shown —
you have to teach a word before you can test it. Every time after, it's **spoken
aloud and stays hidden**, and they spell it from sound. A word sitting on screen
tests copying, not spelling; the on-screen keyboard even stops highlighting the next
key during a hidden word, or it would spell it out one pulsing key at a time.

Words they get wrong come back sooner (Leitner spaced repetition,
`src/engine/srs.ts`), so it targets *their* weak words rather than working through a
fixed list. British spellings by default.

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
  engine/    pure logic, all unit-tested — adaptive, generator, scoring, srs,
             sneakyStars, assist, speech, keymap, and the useTypingSession hook
  store/     schema.ts (versioned save + migrations), profileStore.ts (zustand)
  components/ Keyboard, Hands, TypingArea, SpellingCard, SneakyStar, Chrome
  screens/   Home, LessonMap, Lesson, Results, GardenScreen, BadgeShelf
```

`src/engine/adaptive.ts` holds every difficulty decision as pure functions —
acceleration, the mastery gate, backing off, the difficulty controller, personal
speed. Keeping it in one testable place is what makes it possible to *simulate* a
child's whole journey rather than hoping the rules interact sensibly.

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
versioned with a migration hook (`src/store/schema.ts`) — currently on version 2,
and `src/store/schema.test.ts` checks that a version 1 save keeps its coins,
garden, badges and level rather than resetting. Clearing site data clears the lot;
there's no backup, because there's no server.
