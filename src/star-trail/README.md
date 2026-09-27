# Star Trail

A space touch-typing game that lives beside Typing Teacher, at its own address
(`/typing-teacher/star-trail/`) with its own save. It started as a page of ideas
in a kid's notebook:

> You look for something by typing a letter. The letter adds another letter
> until it is a word, then more letters and words until it makes a sentence.
> When you've made a sentence you find The Secret Thing, which gets harder to
> find each time you find something that helps you. You get money, and you use
> the money to buy something that helps you find the next thing.

```bash
npm run dev    # then open http://localhost:5173/typing-teacher/star-trail/
```

## The story

Long ago, a star storm broke the Lost Ship into thirty pieces. Its crew,
Captain Zog, Commander Pip and Robot Bleep, hid the pieces on ten planets. Then
they drifted off in their escape pod, leaving a trail of glowing letters to
every piece. The messages on the trails are theirs, and they're a silly bunch.
Rebuild the ship and it takes you to them. The premise is in `data/story.ts`
and the payoff in `data/ending.ts`.

Each planet's name hides the letters it teaches, as a memory aid: Seal Isle
(E, I), Rusty Rock (R, U), Yeti Tundra (T, Y), Glow Heights (G, H), Planet
Doughnut (O, N), Volcano Moon (C, V, M), Warp Quasar (W, Q, P) and Buzzbox
(B, X, Z). Home Moon is the home row and Capital Star is for capitals. The
names also match the planets' messages: seals skiing, yetis eating stardust
jelly, and a lost treasure inside the volcano.

## How it plays

**Follow the trail.** A trail of glowing letters stretches across space. Only
the next letter shows (a scanner lets you see further). Type it and the ship
moves on. Letters make words, and words make a message from the crew of the
**Lost Ship**. Finish the message and you've found a piece of the ship.

**Ten planets, ten parts.** Each planet teaches new keys, in the same order as
Typing Teacher's lessons, and hides three pieces of one part of the Lost Ship.
Find all thirty and the ship flies again.

**Fuel.** A wrong key burns fuel, but only the first wrong key on a letter
costs anything, so one key you can't find won't empty the tank. Shields take
the hit first. Run out and a tow-drone brings you home: you keep your stardust
but not the piece. There are no timers anywhere.

**Stardust** pays for four helpers at the **space station**:

| Helper  | What it does |
|---|---|
| Scanner | See further along the trail |
| Shields | Soak up slips before they cost fuel |
| Robot   | Press ↑ to grab stardust sparkles as they drift past (a kid watching their hands misses them) |
| Engines | Fly to the next planet |

The on-screen keyboard and finger guide are free, always. They fade as a
pilot gets better and come back when they struggle.

**The notebook's rule.** Each Secret Thing gets harder to find. Trails get longer with
every piece and planet, and further planets are darker, so you see less of
the trail. Every three helper upgrades also take you a step deeper, where
it's darker and the trails are longer but the stardust is richer. Trail
length is always capped by what the pilot's recent accuracy and fuel can
cover, so a tow is real but occasional.

**Keeping it kind.** The first three hunts are training flights and can't run
dry. Tows in a row shorten the next trail and add spare fuel. After five misses
on one letter, → skips it. Before a jump to new keys, the navigator checks
that the current planet's new keys have stuck, and it eases off for a pilot
who's been on a planet a long time.

## Changing things

Everything a grown-up (or the game's inventor) is likely to want to change is
data:

| To change… | Edit |
|---|---|
| The messages on the trails | `data/sentences.ts`. `npm test` checks every message only uses its planet's keys. |
| Planet names and colours | `data/planets.ts`. A test checks each name still hides its planet's new letters. |
| The story, and where the Lost Ship takes you at the end | `data/story.ts` and `data/ending.ts` |
| Ship part names | `data/ship.ts` |
| Prices, fuel, trail lengths and every other number | `engine/balance.ts` |

Two dials in `engine/balance.ts` change the feel most:

- `SAFETY_FACTOR` sets how scary fuel is. Raise it for fewer tows, lower it for more.
- `ENGINE_PRICE_SCALE` sets how long each planet lasts. Raise it for more practice
  on each set of keys.

`engine/journey.test.ts` flies simulated kids from 97% to 60% accuracy through
the whole galaxy with the real game. If a change makes it unfair (or
impossible to fail), a test goes red. `JOURNEY_REPORT=1 npx vitest run journey`
prints the numbers.

## Layout

```
data/        planets (from Typing Teacher's curriculum), sentences, ship, shop text, ending
engine/      pure rules, all unit-tested: the trail reducer, keys, trail choice, difficulty,
             economy, planning and settling a hunt, keyboard help, sparkles, sound, useTrail
store/       the save (schema.ts: sanitised, never throws), safe storage, the zustand store
components/  neon keyboard and hands, the trail, gauges, sprites, the Lost Ship blueprint
screens/     Hangar, Galaxy, Arrival, Hunt, Found/Towed, SpaceStation, LostShip/Ending
```

It shares only four dependency-free files with Typing Teacher: the key map,
the seeded random numbers, speech, and the curriculum's key order.
`boundaries.test.ts` keeps it that way.

The save lives in `localStorage` under `star-trail.save.v1`. It's separate
from Typing Teacher's and never touches it. A save that can't be read is
copied to `star-trail.save.v1.corrupt` rather than lost.
