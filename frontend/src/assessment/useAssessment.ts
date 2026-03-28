import { useSyncExternalStore } from 'react'

const KEY = 'g7:assessment'
const UPDATE_EVENT = 'g7-assessment-updated'

export type StoredAssessment = {
  zoneId: 'green' | 'yellow' | 'orange' | 'red'
  totalRisk: number
  completedAt: string
  safetyOverride?: boolean
}

/** Cached so `getSnapshot` returns referentially stable values when localStorage is unchanged (required by useSyncExternalStore). */
let cachedRaw: string | null | undefined
let cachedSnapshot: StoredAssessment | null = null

function getSnapshot(): StoredAssessment | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw === cachedRaw) {
      return cachedSnapshot
    }
    cachedRaw = raw
    if (!raw) {
      cachedSnapshot = null
      return null
    }
    cachedSnapshot = JSON.parse(raw) as StoredAssessment
    return cachedSnapshot
  } catch {
    cachedRaw = null
    cachedSnapshot = null
    return null
  }
}

function getServerSnapshot(): StoredAssessment | null {
  return null
}

export function saveAssessment(data: StoredAssessment) {
  const next = JSON.stringify(data)
  localStorage.setItem(KEY, next)
  cachedRaw = next
  cachedSnapshot = data
  window.dispatchEvent(new Event(UPDATE_EVENT))
}

function subscribe(cb: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) cb()
  }
  const onLocal = () => cb()
  window.addEventListener('storage', onStorage)
  window.addEventListener(UPDATE_EVENT, onLocal)
  return () => {
    window.removeEventListener('storage', onStorage)
    window.removeEventListener(UPDATE_EVENT, onLocal)
  }
}

export function useAssessment() {
  const stored = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  return { stored, saveAssessment }
}
