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
  sentence, fewer Spelling Stars. Repeat lessons rotate short key patterns and
  draw fresh words from the wider bank, always using unlocked keys. Most words
  target the new keys, with familiar material mixed in for confidence.
- **Tricky bits return after a break.** Recent words and patterns are remembered
  across reloads. A missed typing item gets a full lesson's gap, then at most one
  exact typing review appears per lesson. A clean return earns a longer gap; two
  clean returns retire it. Spelling also respects a full lesson's gap after a miss.
  Progression still depends on accuracy, and every completed round earns rewards.
- **Help comes back.** If accuracy stays low the keyboard steps back in, and the app
  *offers* an easier level — as an offer, with a fresh mix on the current level right beside it.
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
then real words and sentences. Level 1 is unavoidably drill-only (there are
no words in "f j"), so it stays short — the aim is to reach real words in the
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

**Rewards that accumulate.** Coins, a daily streak, 20 badges, and a collection
that grows one stage per lesson. Nothing wilts, nothing dies, nothing nags — skip
a fortnight and it's exactly as you left it.

Each player picks what their coins buy when they're created:

- **Garden** — painted seedlings that grow into illustrated flowers and trees.
- **Women's Super League** — collect an 18-player squad of WSL and Lionesses players.
  Each lesson is a training session that upgrades her card: Academy → Bronze →
  Silver → Gold → Legend. Each card has its own illustrated player portrait,
  a shirt in club colours, and a frame that upgrades. Each player has a different
  price, from 10 to 95 coins. The squad, prices and clubs
  are in `src/data/rewards/football.ts`; update them there when players move.
- **Pokémon** — eggs that hatch and then evolve, across nine evolution lines.
  Speckled eggs and all 26 characters use painted illustrations with transparent
  backgrounds. These are generated fan illustrations, not official artwork.
- **Animals** — 18 species with three illustrations each: six birds, six mammals, and six more
  animals including reptiles, a frog, a seahorse, an octopus and a butterfly.
  Browse by animal type. Each species has a different price, from 10 to 95 coins;
  every lesson grows your animals one
  stage: Baby → Juvenile → Adult. Frogs grow from tadpoles through froglets,
  and butterflies from caterpillars through chrysalises.
- **Dinosaurs** — 18 dinosaurs, grouped into Crests & armour, Long necks and Two-legged.
  Buy an egg for 10–95 coins, then grow it through Hatchling → Juvenile → Adult.
  Every age has its own illustration. Adults unlock a short, sourced fact in your
  dinosaur book, and you can swap your dinosaurs' places on the island.

Garden, Pokémon, Animals and Dinosaurs start with **18 spaces** and automatically add six
more whenever the collection fills. There is no purchase limit for these themes,
so a longer practice journey never runs out of rewards. Their collection badge
is earned at 18; badges earned under the old 12-space limit stay earned.
Football has 18 unique players: a starting eleven plus seven more squad members.
The full-squad badge now targets 18; an already-earned football badge stays earned.

Generated images live in `public/art/rewards/` as transparent 512px WebP files.
Each plant, egg, dinosaur and player portrait was requested individually using the built-in
image generator. The Pokémon and animals were generated individually with Nano Banana 2,
using the supplied Pikachu as a style reference. The exact prompt set and asset
notes are in `docs/reward-art.md`; `docs/nano-banana-2.md`, `docs/animal-art.md`,
`docs/football-art.md` and `docs/dinosaur-art.md` describe the artwork and regeneration.
All images load locally; names, prices, card tiers and saved growth stages remain data.

The theme can't be changed later, because switching would leave a whole
collection behind. To try a different one, make another player. Every theme is a
fixed catalogue, and the tests check that every stage a kid can reach has been
drawn.

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
  data/      curriculum.ts (12 levels), spellingWords.ts, badges.ts,
             rewards/ (garden, football, pokemon, animals and dinosaurs themes)
  art/       RewardArt, portrait cards, asset mappings and fallback egg art
  engine/    pure logic, all unit-tested — adaptive, generator, practice, scoring, srs,
             sneakyStars, assist, speech, keymap, and the useTypingSession hook
  store/     schema.ts (versioned save + migrations), profileStore.ts (zustand)
  components/ Keyboard, Hands, TypingArea, SpellingCard, SneakyStar, Chrome
  screens/   Home, LessonMap, Lesson, Results, CollectionScreen, BadgeShelf
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
player, so several kids can share one computer with separate collections. The
save is versioned with a migration hook (`src/store/schema.ts`), currently at
version 4. The v3 → v4 migration adds empty practice memory. `src/store/schema.test.ts` checks that older saves keep their coins,
garden, badges and level rather than resetting (v1 and v2 players become
gardeners). Clearing site data clears the lot;
there's no backup, because there's no server.
