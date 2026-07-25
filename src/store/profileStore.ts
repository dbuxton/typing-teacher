import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  HISTORY_LIMIT,
  SAVE_VERSION,
  STORAGE_KEY,
  type LessonResult,
  type Profile,
  type SaveFile,
  daysBetween,
  makeProfile,
  migrate,
  today,
} from './schema'
import { GARDEN_PLOTS, plantKindById } from '../data/plants'
import { newlyEarnedBadges } from '../data/badges'
import { assistAfterLesson } from '../engine/assist'
import { applyResults } from '../engine/srs'
import { MAX_LEVEL } from '../data/curriculum'

export type Screen = 'home' | 'map' | 'lesson' | 'results' | 'garden' | 'badges'

/** Everything a finished lesson tells the store. */
export type LessonOutcome = {
  levelId: number
  accuracy: number
  wpm: number
  stars: number
  coins: number
  sneakyStarsCaught: number
  sneakyStarsTotal: number
  spellingAnswers: { word: string; correct: boolean }[]
  keyErrors: Record<string, number>
  wordsTyped: number
  charsTyped: number
}

type State = {
  save: SaveFile
  screen: Screen
  /** Set when a lesson finishes so the results screen has something to show. */
  lastResult: (LessonResult & { newBadges: string[]; assistPromotedTo: string | null }) | null

  activeProfile: () => Profile | null
  setScreen: (screen: Screen) => void
  addProfile: (name: string, avatar: string) => void
  selectProfile: (id: string) => void
  deleteProfile: (id: string) => void
  setLevel: (levelId: number) => void
  toggleSneakyStars: () => void
  recordLesson: (outcome: LessonOutcome) => void
  plantSeed: (kindId: string) => void
}

function updateProfile(save: SaveFile, id: string, fn: (p: Profile) => Profile): SaveFile {
  return { ...save, profiles: save.profiles.map((p) => (p.id === id ? fn(p) : p)) }
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      save: { version: SAVE_VERSION, profiles: [], activeProfileId: null },
      screen: 'home',
      lastResult: null,

      activeProfile: () => {
        const { save } = get()
        return save.profiles.find((p) => p.id === save.activeProfileId) ?? null
      },

      setScreen: (screen) => set({ screen }),

      addProfile: (name, avatar) =>
        set((state) => {
          const profile = makeProfile(name, avatar)
          return {
            save: {
              ...state.save,
              profiles: [...state.save.profiles, profile],
              activeProfileId: profile.id,
            },
            screen: 'map',
          }
        }),

      selectProfile: (id) =>
        set((state) => ({ save: { ...state.save, activeProfileId: id }, screen: 'map' })),

      deleteProfile: (id) =>
        set((state) => {
          const profiles = state.save.profiles.filter((p) => p.id !== id)
          return {
            save: {
              ...state.save,
              profiles,
              activeProfileId: state.save.activeProfileId === id ? null : state.save.activeProfileId,
            },
            screen: 'home',
          }
        }),

      setLevel: (levelId) =>
        set((state) => {
          const id = state.save.activeProfileId
          if (!id) return state
          return { save: updateProfile(state.save, id, (p) => ({ ...p, currentLevel: levelId })) }
        }),

      toggleSneakyStars: () =>
        set((state) => {
          const id = state.save.activeProfileId
          if (!id) return state
          return {
            save: updateProfile(state.save, id, (p) => ({ ...p, sneakyStars: !p.sneakyStars })),
          }
        }),

      recordLesson: (outcome) =>
        set((state) => {
          const id = state.save.activeProfileId
          const current = state.save.profiles.find((p) => p.id === id)
          if (!id || !current) return state

          const date = today()
          const spellingCorrect = outcome.spellingAnswers.filter((a) => a.correct).length

          const result: LessonResult = {
            levelId: outcome.levelId,
            accuracy: outcome.accuracy,
            wpm: outcome.wpm,
            stars: outcome.stars,
            coinsEarned: outcome.coins,
            sneakyStarsCaught: outcome.sneakyStarsCaught,
            sneakyStarsTotal: outcome.sneakyStarsTotal,
            spellingCorrect,
            spellingTotal: outcome.spellingAnswers.length,
            assistLevel: current.assistLevel,
            date,
          }

          // Streak: same day is a no-op, next day extends, any longer resets to 1.
          const gap = current.lastPlayedDate ? daysBetween(current.lastPlayedDate, date) : null
          const streak = gap === 0 ? current.streak : gap === 1 ? current.streak + 1 : 1

          // Every planted seed grows one stage per completed lesson.
          const garden = current.garden.map((plant) => {
            const kind = plantKindById(plant.kindId)
            const max = kind ? kind.stages.length - 1 : plant.stage
            return { ...plant, stage: Math.min(plant.stage + 1, max) }
          })

          const keyErrors = { ...current.keyErrors }
          for (const [key, count] of Object.entries(outcome.keyErrors)) {
            keyErrors[key] = (keyErrors[key] ?? 0) + count
          }

          const lessonNumber = current.lessonsCompleted + 1
          const spelling = applyResults(current.spelling, outcome.spellingAnswers, lessonNumber)

          // Clearing a level at two stars or better unlocks the next one.
          const cleared = outcome.stars >= 2 && outcome.levelId === current.highestLevelUnlocked
          const highestLevelUnlocked = cleared
            ? Math.min(current.highestLevelUnlocked + 1, MAX_LEVEL)
            : current.highestLevelUnlocked

          const assistLevel = assistAfterLesson(current, outcome.accuracy)
          const assistPromotedTo = assistLevel !== current.assistLevel ? assistLevel : null

          const updated: Profile = {
            ...current,
            coins: current.coins + outcome.coins,
            streak,
            lastPlayedDate: date,
            garden,
            keyErrors,
            spelling,
            highestLevelUnlocked,
            currentLevel: cleared ? highestLevelUnlocked : current.currentLevel,
            assistLevel,
            lessonsCompleted: lessonNumber,
            totalWordsTyped: current.totalWordsTyped + outcome.wordsTyped,
            totalCharsTyped: current.totalCharsTyped + outcome.charsTyped,
            spellingWordsCorrect: current.spellingWordsCorrect + spellingCorrect,
            history: [...current.history, result].slice(-HISTORY_LIMIT),
          }

          // Badges are evaluated against the profile *after* the lesson landed.
          const newBadges = newlyEarnedBadges(updated, result)
          const withBadges: Profile = { ...updated, badges: [...updated.badges, ...newBadges] }

          return {
            save: updateProfile(state.save, id, () => withBadges),
            lastResult: { ...result, newBadges, assistPromotedTo },
            screen: 'results',
          }
        }),

      plantSeed: (kindId) =>
        set((state) => {
          const id = state.save.activeProfileId
          const current = state.save.profiles.find((p) => p.id === id)
          const kind = plantKindById(kindId)
          if (!id || !current || !kind) return state
          if (current.coins < kind.cost) return state
          if (current.garden.length >= GARDEN_PLOTS) return state

          return {
            save: updateProfile(state.save, id, (p) => ({
              ...p,
              coins: p.coins - kind.cost,
              garden: [...p.garden, { kindId, stage: 0 }],
            })),
          }
        }),
    }),
    {
      name: STORAGE_KEY,
      version: SAVE_VERSION,
      // Only the save file is persisted — screen and lastResult are session state.
      partialize: (state) => ({ save: state.save }),
      migrate: (persisted, version) => ({ save: migrate((persisted as { save?: unknown })?.save, version) }),
    },
  ),
)
