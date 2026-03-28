import { apiURL } from './config'
import type { NlnAnswer } from '../assessment/nlnCheckIn'

/** Max Likert scale per NLN question id (must match backend parseLikertAnswer second token). */
export function maxForQuestionId(questionId: string): number {
  const n = Number.parseInt(questionId.replace(/^Q/, ''), 10)
  if (Number.isNaN(n)) return 3
  if (n >= 1 && n <= 4) return 3
  if (n === 13) return 3
  return 4
}

/** Build `answers` map for POST /api/wellness-quiz (`"score max"` per item). */
export function nlnAnswersToWellnessPayload(answers: NlnAnswer[]): Record<string, string> {
  const out: Record<string, string> = {}
  for (const a of answers) {
    const max = maxForQuestionId(a.questionId)
    out[a.questionId] = `${a.value} ${max}`
  }
  return out
}

/** Map app gender values to labels the ML / backend expect. */
export function mapGenderForAPI(gender: string | null | undefined): string {
  const x = (gender ?? '').toLowerCase().trim()
  if (x === 'woman' || x === 'female') return 'Female'
  if (x === 'man' || x === 'male') return 'Male'
  return 'Other'
}

export type WellnessQuizAPIBody = {
  email: string
  age: number
  gender: string
  answers: Record<string, string>
}

export type WellnessQuizAPIResponse = {
  prediction: unknown
  prediction_code: number
  target_column: string
  features: Record<string, unknown>
  frontend_result: {
    zone: string
    title: string
    description: string
    age_group: string
    gender: string
    tasks: { title: string; description: string; url?: string }[]
  }
  daily_ember?: number
  streak?: number
}

export async function postWellnessQuiz(
  body: WellnessQuizAPIBody,
): Promise<{ ok: true; data: WellnessQuizAPIResponse } | { ok: false; error: string }> {
  let res: Response
  try {
    res = await fetch(apiURL('/api/wellness-quiz'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch {
    return { ok: false, error: 'Could not reach the server.' }
  }

  const text = await res.text()
  let json: unknown
  try {
    json = text ? JSON.parse(text) : {}
  } catch {
    return { ok: false, error: 'Invalid response from server.' }
  }

  if (!res.ok) {
    console.warn('[wellness-quiz] backend error', res.status, json)
    const err = (json as { error?: string })?.error ?? `Request failed (${res.status})`
    return { ok: false, error: err }
  }

  const data = json as WellnessQuizAPIResponse
  console.log('[wellness-quiz] backend response', data)
  return { ok: true, data }
}
