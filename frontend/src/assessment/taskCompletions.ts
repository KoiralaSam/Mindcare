/** Persist which task indices are completed for a given wellness result (`savedAt`). */

export function getCompletedTaskIndices(savedAt: string): Set<number> {
  if (!savedAt) return new Set()
  try {
    const raw = localStorage.getItem(`g7:tasks-done:${savedAt}`)
    if (!raw) return new Set()
    const arr = JSON.parse(raw) as unknown
    if (!Array.isArray(arr)) return new Set()
    return new Set(arr.filter((n): n is number => typeof n === 'number' && Number.isInteger(n) && n >= 0))
  } catch {
    return new Set()
  }
}

export function addCompletedTaskIndex(savedAt: string, index: number) {
  if (!savedAt) return
  const s = getCompletedTaskIndices(savedAt)
  s.add(index)
  localStorage.setItem(`g7:tasks-done:${savedAt}`, JSON.stringify([...s].sort((a, b) => a - b)))
}
