/** User row returned from POST /api/login (matches Go JSON tags). */
export type BackendUser = {
  id: number
  nickname: string
  email: string
  age?: number | null
  gender?: string | null
  daily_ember: number
  streak: number
  avatar: string
  created_at: string
}
