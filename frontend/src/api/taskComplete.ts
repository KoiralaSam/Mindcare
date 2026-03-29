import { apiURL } from './config'

export type TaskCompleteResponse = {
  daily_ember: number
  streak: number
}

export async function postTaskComplete(email: string): Promise<TaskCompleteResponse> {
  const res = await fetch(apiURL('/api/task-complete'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim().toLowerCase() }),
  })
  const text = await res.text()
  let json: unknown = {}
  try {
    json = text ? JSON.parse(text) : {}
  } catch {
    /* ignore */
  }
  if (!res.ok) {
    const err = (json as { error?: string })?.error ?? `Request failed (${res.status})`
    throw new Error(err)
  }
  return json as TaskCompleteResponse
}
