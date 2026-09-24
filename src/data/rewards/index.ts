import { FOOTBALL } from './football'
import { GARDEN } from './garden'
import { POKEMON } from './pokemon'
import type { RewardKind, RewardStage, RewardTheme, ThemeId } from './types'

export type { RewardKind, RewardStage, RewardTheme, ThemeId } from './types'

/** In picker order. The garden comes first because it's the default. */
export const THEMES: RewardTheme[] = [GARDEN, FOOTBALL, POKEMON]

export const DEFAULT_THEME: ThemeId = 'garden'

export function isThemeId(value: unknown): value is ThemeId {
  return THEMES.some((t) => t.id === value)
}

/** Falls back to the garden, so an odd save never leaves a kid with no theme. */
export function themeById(id: string | undefined): RewardTheme {
  return THEMES.find((t) => t.id === id) ?? GARDEN
}

export function rewardKind(themeId: ThemeId, kindId: string): RewardKind | undefined {
  return themeById(themeId).kinds.find((k) => k.id === kindId)
}

/** The highest stage a kind can reach, or undefined for an unknown kind. */
export function maxStage(themeId: ThemeId, kindId: string): number | undefined {
  const kind = rewardKind(themeId, kindId)
  return kind ? kind.stages.length - 1 : undefined
}

/**
 * What something that has been growing for `stage` lessons looks like. Clamps
 * past the last stage rather than going blank, and returns undefined for a kind
 * the theme doesn't know (an old save) so the caller can draw a starter instead.
 */
export function rewardStage(themeId: ThemeId, kindId: string, stage: number): RewardStage | undefined {
  const kind = rewardKind(themeId, kindId)
  if (!kind) return undefined
  return kind.stages[Math.min(Math.max(stage, 0), kind.stages.length - 1)]
}

export function isFullyGrown(themeId: ThemeId, kindId: string, stage: number): boolean {
  const max = maxStage(themeId, kindId)
  return max !== undefined && stage >= max
}

/** Which stage a shop item previews, honouring negative indexes from the end. */
export function shopPreviewStage(theme: RewardTheme, kind: RewardKind): number {
  const last = kind.stages.length - 1
  const index = theme.shopPreviewStage < 0 ? last + 1 + theme.shopPreviewStage : theme.shopPreviewStage
  return Math.min(Math.max(index, 0), last)
}
