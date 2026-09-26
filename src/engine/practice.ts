import type { PracticeAnswer, PracticeProgress } from '../store/schema'

export const PRACTICE_MEMORY_LIMIT = 120

/**
 * Keep a lesson between a miss and its next review. A clean review earns a
 * longer gap, and two clean reviews retire the item. Successful new items only
 * need to be remembered briefly to avoid identical next-round material.
 */
export function rememberPractice(
  previous: PracticeProgress[],
  answers: PracticeAnswer[],
  lessonNumber: number,
): PracticeProgress[] {
  const memory = new Map(previous.map(item => [item.text, item]))
  const unique = new Map<string, PracticeAnswer>()
  for (const answer of answers) {
    const earlier = unique.get(answer.text)
    unique.set(answer.text, { ...answer, correct: answer.correct && (earlier?.correct ?? true) })
  }
  for (const answer of unique.values()) {
    const old = memory.get(answer.text)
    const reviewing = old?.dueAt != null
    const cleanReviews = answer.correct && reviewing ? old.cleanReviews + 1 : 0
    const dueAt = !answer.correct
      ? lessonNumber + 2
      : reviewing && cleanReviews < 2 ? lessonNumber + 4 : null
    memory.set(answer.text, {
      kind: answer.kind, text: answer.text, lastSeenAt: lessonNumber, dueAt, cleanReviews,
    })
  }
  return [...memory.values()]
    .filter(item => item.dueAt !== null || item.lastSeenAt >= lessonNumber - 2)
    .sort((a, b) => Number(b.dueAt !== null) - Number(a.dueAt !== null) || b.lastSeenAt - a.lastSeenAt)
    .slice(0, PRACTICE_MEMORY_LIMIT)
}
