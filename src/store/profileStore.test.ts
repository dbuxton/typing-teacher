import { beforeEach, describe, expect, it, vi } from 'vitest'
import { themeById, type ThemeId } from '../data/rewards'
import { makeProfile, SAVE_VERSION, STORAGE_KEY } from './schema'
import type { LessonOutcome } from './profileStore'

const storage = new Map<string, string>()
const localStorage = {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => storage.set(key, value),
  removeItem: (key: string) => storage.delete(key),
}
vi.stubGlobal('window', { localStorage })
const { useStore } = await import('./profileStore')

const lesson: LessonOutcome = {
  levelId: 1, accuracy: 1, wpm: 8, stars: 3, coins: 20,
  sneakyStarsCaught: 0, sneakyStarsTotal: 0, spellingAnswers: [],
  practiceAnswers: [],
  keyErrors: {}, keyAttempts: { f: 10, j: 10 }, wordsTyped: 6, charsTyped: 20,
}

function seed(theme: ThemeId, count: number, coins = 100) {
  const kind = themeById(theme).kinds[0]
  const profile = {
    ...makeProfile('Kit', '🦊', theme), coins,
    garden: Array.from({ length: count }, () => ({ kindId: kind.id, stage: 0 })),
  }
  useStore.setState({
    save: { version: SAVE_VERSION, profiles: [profile], activeProfileId: profile.id },
    screen: 'collection', lastResult: null,
  })
  return kind
}

beforeEach(() => storage.clear())

describe('expanding collections', () => {
  it.each(['garden', 'pokemon', 'animals'] as const)('allows a 13th, 19th and 25th purchase in %s and persists it', async theme => {
    for (const count of [12, 18, 24]) {
      const kind = seed(theme, count)
      useStore.getState().collectReward(kind.id)
      expect(useStore.getState().activeProfile()?.garden).toHaveLength(count + 1)
      expect(useStore.getState().activeProfile()?.coins).toBe(100 - kind.cost)
      expect(storage.has(STORAGE_KEY)).toBe(true)
      await useStore.persist.rehydrate()
      expect(useStore.getState().activeProfile()?.theme).toBe(theme)
      expect(useStore.getState().activeProfile()?.garden).toHaveLength(count + 1)
    }
  })

  it('still rejects unaffordable rewards and unknown kinds', () => {
    const kind = seed('animals', 18, 0)
    const before = useStore.getState().activeProfile()
    useStore.getState().collectReward(kind.id)
    useStore.getState().collectReward('not-an-animal')
    expect(useStore.getState().activeProfile()).toBe(before)
  })

  it('allows all eighteen footballers but never duplicates', () => {
    const kind = seed('football', 1)
    useStore.getState().collectReward(kind.id)
    expect(useStore.getState().activeProfile()?.garden).toHaveLength(1)
    expect(useStore.getState().activeProfile()?.coins).toBe(100)
    seed('football', 0, 1000)
    const players = themeById('football').kinds
    const remainingCoins = 1000 - players.reduce((total, player) => total + player.cost, 0)
    for (const player of players) useStore.getState().collectReward(player.id)
    expect(useStore.getState().activeProfile()?.garden).toHaveLength(18)
    expect(useStore.getState().activeProfile()?.coins).toBe(remainingCoins)
    useStore.getState().collectReward(kind.id)
    expect(useStore.getState().activeProfile()?.garden).toHaveLength(18)
    expect(useStore.getState().activeProfile()?.coins).toBe(remainingCoins)
  })

  it('awards the collection badge at 18 even though more spaces have appeared', () => {
    const kind = seed('animals', 17)
    useStore.getState().recordLesson(lesson)
    expect(useStore.getState().activeProfile()?.badges).not.toContain('full-garden')
    useStore.getState().collectReward(kind.id)
    useStore.getState().recordLesson(lesson)
    expect(useStore.getState().activeProfile()?.badges).toContain('full-garden')
    useStore.getState().recordLesson(lesson)
    expect(useStore.getState().activeProfile()?.badges.filter(id => id === 'full-garden')).toHaveLength(1)
  })

  it('keeps an already-earned collection badge from the old twelve-space garden', () => {
    seed('garden', 12)
    const save = useStore.getState().save
    useStore.setState({ save: { ...save, profiles: [{ ...save.profiles[0], badges: ['full-garden'] }] } })
    useStore.getState().recordLesson(lesson)
    expect(useStore.getState().activeProfile()?.badges).toContain('full-garden')
  })
})

describe('practice memory', () => {
  it('saves mistakes for later without changing coins or collected rewards', async () => {
    seed('animals', 1)
    useStore.getState().recordLesson({ ...lesson, practiceAnswers: [
      { kind: 'drill', text: 'fj jf', correct: false },
      { kind: 'drill', text: 'ff jj', correct: true },
    ] })
    await useStore.persist.rehydrate()
    const profile = useStore.getState().activeProfile()!
    expect(profile.practice).toEqual(expect.arrayContaining([
      expect.objectContaining({ text: 'fj jf', lastSeenAt: 1, dueAt: 3 }),
      expect.objectContaining({ text: 'ff jj', lastSeenAt: 1, dueAt: null }),
    ]))
    expect(profile.coins).toBe(120)
    expect(profile.garden[0].stage).toBe(1)
  })
})

describe('animal growth', () => {
  it('creates an animal profile and grows babies once per lesson, stopping at adulthood', async () => {
    seed('garden', 0)
    useStore.getState().addProfile('Ava', '🦉', 'animals')
    expect(useStore.getState().activeProfile()?.theme).toBe('animals')
    useStore.getState().recordLesson(lesson)
    useStore.getState().collectReward('robin')
    expect(useStore.getState().activeProfile()?.garden[0].stage).toBe(0)
    for (const expected of [1, 2, 2]) {
      useStore.getState().recordLesson(lesson)
      expect(useStore.getState().activeProfile()?.garden[0].stage).toBe(expected)
    }
    await useStore.persist.rehydrate()
    expect(useStore.getState().activeProfile()?.theme).toBe('animals')
    expect(useStore.getState().activeProfile()?.garden[0]).toEqual({ kindId: 'robin', stage: 2 })
  })
})
