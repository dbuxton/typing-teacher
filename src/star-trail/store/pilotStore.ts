import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { RECENT_LIMIT, type TrackId } from '../engine/balance'
import { buyUpgrade, launch, travelTo } from '../engine/economy'
import { planHunt, type HuntPlan } from '../engine/plan'
import { settleHunt, type HuntSummary } from '../engine/settle'
import type { HuntOutcome } from '../engine/trail'
import { safeStorage } from './safeStorage'
import {
  SAVE_VERSION,
  STORAGE_KEY,
  emptySave,
  makePilot,
  migrate,
  sanitizeSave,
  type Pilot,
  type SaveFile,
} from './schema'

/**
 * Star Trail's store. Screens are a field here rather than routes — like Typing
 * Teacher, the whole app is one page with no addresses worth linking to.
 *
 * Only the save file is persisted. The screen, the hunt in progress and the
 * last result are session state, so a reload lands back in the hangar: the right
 * place on a computer several kids share.
 */

export type Screen = 'hangar' | 'galaxy' | 'arrival' | 'hunt' | 'found' | 'towed' | 'station' | 'ship' | 'ending'

type State = {
  save: SaveFile
  screen: Screen
  /** The hunt about to start or under way. */
  plan: HuntPlan | null
  /** How the last hunt went, for the Found and Towed screens. */
  lastHunt: HuntSummary | null
  /** The arrival screen is greeting a planet just launched to (rather than a first hunt). */
  justLaunched: boolean
}

type Actions = {
  addPilot(name: string, avatar: string): void
  selectPilot(id: string): void
  deletePilot(id: string): void
  toHangar(): void
  goTo(screen: Screen): void
  /** Fly back to a planet already visited, for practice. */
  travel(planetId: number): void
  startHunt(seed?: number): void
  finishIntro(): void
  recordHunt(outcome: HuntOutcome): void
  buyUpgrade(track: TrackId): void
  launch(): void
  toggleSound(): void
  finishEnding(): void
}

export type Store = State & Actions

type Persisted = { save: SaveFile }

/**
 * Replace one pilot. Returns the same save object when nothing changed, so
 * components subscribed to it don't re-render for nothing.
 */
function updatePilot(save: SaveFile, id: string | null, update: (pilot: Pilot) => Pilot | null): SaveFile {
  let changed = false
  const pilots = save.pilots.map((pilot) => {
    if (pilot.id !== id) return pilot
    const next = update(pilot)
    if (!next || next === pilot) return pilot
    changed = true
    return next
  })
  return changed ? { ...save, pilots } : save
}

/**
 * The pilot playing now. Returns the stored object itself (or null), never a
 * fresh one, so it's safe as a zustand selector.
 */
export function activePilot(state: Pick<State, 'save'>): Pilot | null {
  return state.save.pilots.find((pilot) => pilot.id === state.save.activePilotId) ?? null
}

export const useStarTrail = create<Store>()(
  persist(
    (set, get) => ({
      save: emptySave(),
      screen: 'hangar',
      plan: null,
      lastHunt: null,
      justLaunched: false,

      addPilot(name, avatar) {
        const pilot = makePilot(name, avatar)
        set((state) => ({
          save: { ...state.save, pilots: [...state.save.pilots, pilot], activePilotId: pilot.id },
          screen: 'galaxy',
          plan: null,
          lastHunt: null,
        }))
      },

      selectPilot(id) {
        if (!get().save.pilots.some((pilot) => pilot.id === id)) return
        set((state) => ({ save: { ...state.save, activePilotId: id }, screen: 'galaxy', plan: null, lastHunt: null }))
      },

      deletePilot(id) {
        set((state) => ({
          save: {
            ...state.save,
            pilots: state.save.pilots.filter((pilot) => pilot.id !== id),
            activePilotId: state.save.activePilotId === id ? null : state.save.activePilotId,
          },
          screen: 'hangar',
        }))
      },

      toHangar() {
        set((state) => ({ save: { ...state.save, activePilotId: null }, screen: 'hangar', plan: null, lastHunt: null }))
      },

      goTo(screen) {
        set({ screen })
      },

      travel(planetId) {
        set((state) => ({ save: updatePilot(state.save, state.save.activePilotId, (pilot) => travelTo(pilot, planetId)) }))
      },

      startHunt(seed = Math.floor(Math.random() * 2 ** 31)) {
        const pilot = activePilot(get())
        if (!pilot) return
        const plan = planHunt(pilot, seed)
        // Remember the message now, not at the end: backing out and back in
        // shouldn't re-roll the same trail.
        const recent = [...(pilot.recent[plan.planetId] ?? []), plan.text].slice(-RECENT_LIMIT)
        const needsIntro = !pilot.introsSeen.includes(plan.planetId)
        set((state) => ({
          plan,
          lastHunt: null,
          justLaunched: false,
          screen: needsIntro ? 'arrival' : 'hunt',
          save: updatePilot(state.save, pilot.id, (p) => ({ ...p, recent: { ...p.recent, [plan.planetId]: recent } })),
        }))
      },

      finishIntro() {
        const { plan } = get()
        const pilot = activePilot(get())
        if (!pilot) return
        const planetId = plan?.planetId ?? pilot.planet
        set((state) => ({
          justLaunched: false,
          screen: plan ? 'hunt' : 'galaxy',
          save: updatePilot(state.save, pilot.id, (p) =>
            p.introsSeen.includes(planetId) ? p : { ...p, introsSeen: [...p.introsSeen, planetId] },
          ),
        }))
      },

      recordHunt(outcome) {
        const { plan } = get()
        const pilot = activePilot(get())
        if (!plan || !pilot) return
        const settled = settleHunt(pilot, plan, outcome)
        set((state) => ({
          save: updatePilot(state.save, pilot.id, () => settled.pilot),
          plan: null,
          lastHunt: outcome.result === 'aborted' ? null : settled.summary,
          screen: outcome.result === 'found' ? 'found' : outcome.result === 'towed' ? 'towed' : 'galaxy',
        }))
      },

      buyUpgrade(track) {
        set((state) => ({ save: updatePilot(state.save, state.save.activePilotId, (pilot) => buyUpgrade(pilot, track)) }))
      },

      launch() {
        const pilot = activePilot(get())
        const next = pilot && launch(pilot)
        if (!pilot || !next) return
        set((state) => ({
          save: updatePilot(state.save, pilot.id, () => next),
          screen: 'arrival',
          plan: null,
          lastHunt: null,
          justLaunched: true,
        }))
      },

      toggleSound() {
        set((state) => ({
          save: updatePilot(state.save, state.save.activePilotId, (pilot) => ({ ...pilot, sound: !pilot.sound })),
        }))
      },

      finishEnding() {
        set((state) => ({
          save: updatePilot(state.save, state.save.activePilotId, (pilot) => ({ ...pilot, endingSeen: true })),
          screen: 'galaxy',
        }))
      },
    }),
    {
      name: STORAGE_KEY,
      version: SAVE_VERSION,
      storage: safeStorage<Persisted>(),
      partialize: (state): Persisted => ({ save: state.save }),
      migrate: (persisted, version) => ({ save: migrate((persisted as Partial<Persisted> | null)?.save, version) }),
      // Loads at the current version skip `migrate` entirely, so sanitise here
      // too: a hand-edited or half-written save must never reach the game raw.
      merge: (persisted, current) => {
        const saved = (persisted as Partial<Persisted> | undefined)?.save
        return saved === undefined ? current : { ...current, save: sanitizeSave(saved) }
      },
    },
  ),
)
