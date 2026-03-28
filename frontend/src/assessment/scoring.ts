import type { ZoneId } from './zones'
import { totalRiskToZoneId } from './zones'

/** Q1–Q4 mood/anxiety frequency (0–3 each). */
export type MoodAnswers = readonly [number, number, number, number]

/** Q5–Q8 wellbeing (0–5 each, higher = better wellbeing). */
export type WellbeingAnswers = readonly [number, number, number, number]

/** Q9–Q11 daily function impact (0–4 each). */
export type FunctionAnswers = readonly [number, number, number]

/** Core assessment: 12 answers in order Q1…Q12. */
export type CoreAnswers = {
  mood: MoodAnswers
  wellbeing: WellbeingAnswers
  function: FunctionAnswers
  support: number
}

/** Q13: 0 Never, 1 Rarely, 2 Sometimes, 3 Often. Skip = null. */
export type SafetyAnswer = number | null

export function sumMood(mood: MoodAnswers): number {
  return mood[0] + mood[1] + mood[2] + mood[3]
}

export function sumWellbeing(w: WellbeingAnswers): number {
  return w[0] + w[1] + w[2] + w[3]
}

export function sumFunction(fn: FunctionAnswers): number {
  return fn[0] + fn[1] + fn[2]
}

/**
 * Wellbeing risk: 20 − sum(Q5–Q8). Higher = worse.
 * Each wellbeing item is 0–5, sum 0–20.
 */
export function wellbeingRisk(w: WellbeingAnswers): number {
  return 20 - sumWellbeing(w)
}

/**
 * Support risk: 4 − Q12. Q12 is 0–4 where higher = more support.
 */
export function supportRisk(support: number): number {
  return 4 - support
}

export function totalRisk(core: CoreAnswers): number {
  return (
    sumMood(core.mood) +
    wellbeingRisk(core.wellbeing) +
    sumFunction(core.function) +
    supportRisk(core.support)
  )
}

export function zoneFromCore(core: CoreAnswers): ZoneId {
  return totalRiskToZoneId(totalRisk(core))
}

/** Show Q13 when mood/anxiety ≥ 7 or function sum ≥ 8 (README). */
export function shouldShowQ13(core: CoreAnswers): boolean {
  return sumMood(core.mood) >= 7 || sumFunction(core.function) >= 8
}

/**
 * Safety override: Q13 Sometimes or Often (indices 2 or 3).
 * Skip (null) does not trigger.
 */
export function safetyOverrideFromQ13(q13: SafetyAnswer): boolean {
  return q13 !== null && q13 >= 2
}

export function coreAnswersFromFlat(flat: readonly number[]): CoreAnswers | null {
  if (flat.length !== 12) return null
  const mood = flat.slice(0, 4) as [number, number, number, number]
  const wellbeing = flat.slice(4, 8) as [number, number, number, number]
  const fn = flat.slice(8, 11) as [number, number, number]
  const support = flat[11]
  return { mood, wellbeing, function: fn, support }
}

export function flatFromCore(core: CoreAnswers): number[] {
  return [...core.mood, ...core.wellbeing, ...core.function, core.support]
}
