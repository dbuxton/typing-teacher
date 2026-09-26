import { describe, expect, it } from 'vitest'
import { PRACTICE_MEMORY_LIMIT, rememberPractice } from './practice'
import type { PracticeAnswer } from '../store/schema'

const miss: PracticeAnswer = { kind: 'word', text: 'flask', correct: false }

describe('spaced typing practice', () => {
  it('leaves a whole lesson between a mistake and its return', () => {
    expect(rememberPractice([], [miss], 5)[0]).toMatchObject({ lastSeenAt: 5, dueAt: 7, cleanReviews: 0 })
  })

  it('spaces successful reviews out and retires the item after two clean returns', () => {
    const first = rememberPractice([], [miss], 5)
    const second = rememberPractice(first, [{ ...miss, correct: true }], 7)
    expect(second[0]).toMatchObject({ dueAt: 11, cleanReviews: 1 })
    expect(rememberPractice(second, [{ ...miss, correct: true }], 11)[0].dueAt).toBeNull()
    expect(rememberPractice(second, [miss], 11)[0]).toMatchObject({ dueAt: 13, cleanReviews: 0 })
  })

  it('does not erase a miss if the same text was also completed cleanly', () => {
    expect(rememberPractice([], [miss, { ...miss, correct: true }], 1)[0].dueAt).toBe(3)
  })

  it('keeps overdue misses while discarding old clean material and bounding save size', () => {
    let memory = rememberPractice([], [miss, { ...miss, text: 'dad', correct: true }], 1)
    memory = rememberPractice(memory, [], 10)
    expect(memory.map(item => item.text)).toEqual(['flask'])
    const many = Array.from({ length: 200 }, (_, i) => ({ ...miss, text: `word${i}` }))
    expect(rememberPractice(memory, many, 11)).toHaveLength(PRACTICE_MEMORY_LIMIT)
  })
})
