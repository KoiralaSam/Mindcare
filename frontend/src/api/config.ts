/** Base URL for API calls. Empty = same origin (use Vite proxy in dev: /api → backend). */
export function apiBase(): string {
  const v = import.meta.env.VITE_API_BASE
  if (typeof v === 'string' && v.length > 0) return v.replace(/\/$/, '')
  return ''
}

export function apiURL(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`
  const base = apiBase()
  return base ? `${base}${p}` : p
}
