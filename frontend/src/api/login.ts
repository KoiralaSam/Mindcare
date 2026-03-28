import { apiURL } from './config'
import type { BackendUser } from '../auth/types'

export type LoginAPIResponse = {
  user: BackendUser
  created: boolean
}

export type LoginAPIBody = {
  email: string
  age?: number
  gender?: string
}

export async function postLogin(body: LoginAPIBody): Promise<{ ok: true; data: LoginAPIResponse } | { ok: false; error: string }> {
  let res: Response
  try {
    res = await fetch(apiURL('/api/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch {
    return { ok: false, error: 'Could not reach the server. Is the backend running?' }
  }

  const text = await res.text()
  let json: unknown
  try {
    json = text ? JSON.parse(text) : {}
  } catch {
    return { ok: false, error: 'Invalid response from server.' }
  }

  if (!res.ok) {
    const err = (json as { error?: string })?.error ?? `Request failed (${res.status})`
    return { ok: false, error: err }
  }

  const data = json as LoginAPIResponse
  if (!data?.user?.email) {
    return { ok: false, error: 'Malformed login response.' }
  }
  return { ok: true, data }
}
