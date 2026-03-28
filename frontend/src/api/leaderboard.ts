import { apiURL } from './config'

export type LeaderboardEntry = {
  rank: number
  nickname: string
  streak: number
}

export type LeaderboardResponse = {
  entries: LeaderboardEntry[]
}

export async function fetchLeaderboard(limit = 50, signal?: AbortSignal): Promise<LeaderboardResponse> {
  const url = `${apiURL('/api/leaderboard')}?limit=${encodeURIComponent(String(limit))}`
  const res = await fetch(url, { method: 'GET', signal })
  if (!res.ok) {
    throw new Error(`leaderboard ${res.status}`)
  }
  const json = (await res.json()) as unknown
  if (!json || typeof json !== 'object' || !('entries' in json)) {
    return { entries: [] }
  }
  const entries = (json as { entries?: unknown }).entries
  return {
    entries: Array.isArray(entries) ? (entries as LeaderboardResponse['entries']) : [],
  }
}
