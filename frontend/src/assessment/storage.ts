import type { ZoneId } from './zones'
import type { CoreAnswers, SafetyAnswer } from './scoring'
import { coreAnswersFromFlat, flatFromCore } from './scoring'

const STORAGE_PREFIX = 'nln:assessment:'

export type StoredAssessment = {
  version: 1
  flatAnswers: number[]
  q13: SafetyAnswer
  /** True if user completed Q13 path (answered or explicitly skipped when shown). */
  q13Addressed: boolean
  totalRisk: number
  zoneId: ZoneId
  safetyOverride: boolean
  completedAt: string
}

export function storageKeyForEmail(email: string): string {
  return `${STORAGE_PREFIX}${email.trim().toLowerCase()}`
}

export function readStoredAssessment(email: string | null): StoredAssessment | null {
  if (!email) return null
  try {
    const raw = sessionStorage.getItem(storageKeyForEmail(email))
    if (!raw) return null
    const data = JSON.parse(raw) as StoredAssessment
    if (data?.version !== 1 || !Array.isArray(data.flatAnswers)) return null
    return data
  } catch {
    return null
  }
}

export function writeStoredAssessment(email: string, payload: StoredAssessment): void {
  sessionStorage.setItem(storageKeyForEmail(email), JSON.stringify(payload))
}

export function clearStoredAssessment(email: string): void {
  sessionStorage.removeItem(storageKeyForEmail(email))
}

export function buildStoredAssessment(
  core: CoreAnswers,
  q13: SafetyAnswer,
  q13Addressed: boolean,
  totalRisk: number,
  zoneId: ZoneId,
  safetyOverride: boolean,
): StoredAssessment {
  return {
    version: 1,
    flatAnswers: flatFromCore(core),
    q13,
    q13Addressed,
    totalRisk,
    zoneId,
    safetyOverride,
    completedAt: new Date().toISOString(),
  }
}

export function coreFromStored(stored: StoredAssessment): CoreAnswers | null {
  return coreAnswersFromFlat(stored.flatAnswers)
}
