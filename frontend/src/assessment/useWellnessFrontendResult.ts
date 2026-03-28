import { useSyncExternalStore } from 'react'
import type { WellnessQuizAPIResponse } from '../api/wellnessQuiz'

const KEY = 'g7:wellness-frontend-result'
const UPDATE_EVENT = 'g7-wellness-frontend-updated'

export type StoredWellnessFrontend = WellnessQuizAPIResponse['frontend_result'] & {
  savedAt: string
}

let cachedRaw: string | null | undefined
let cachedSnapshot: StoredWellnessFrontend | null = null

function getSnapshot(): StoredWellnessFrontend | null {
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
    cachedSnapshot = JSON.parse(raw) as StoredWellnessFrontend
    return cachedSnapshot
  } catch {
    cachedRaw = null
    cachedSnapshot = null
    return null
  }
}

function getServerSnapshot(): StoredWellnessFrontend | null {
  return null
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

export function saveWellnessFrontendResult(fr: WellnessQuizAPIResponse['frontend_result']) {
  const data: StoredWellnessFrontend = {
    ...fr,
    savedAt: new Date().toISOString(),
  }
  const raw = JSON.stringify(data)
  localStorage.setItem(KEY, raw)
  cachedRaw = raw
  cachedSnapshot = data
  window.dispatchEvent(new Event(UPDATE_EVENT))
}

export function useWellnessFrontendResult() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
