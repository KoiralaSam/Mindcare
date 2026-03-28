export type ZoneId = 'green' | 'yellow' | 'orange' | 'red'

export type ZoneMeta = {
  id: ZoneId
  name: string
  range: string
  label: string
  copy: string
  tone: string
}

export const ZONES: readonly ZoneMeta[] = [
  {
    id: 'green',
    name: 'Green',
    range: '0–12',
    label: 'Doing okay',
    copy: 'Steady place — emotional fitness, habits, and prevention.',
    tone: 'var(--zone-green)',
  },
  {
    id: 'yellow',
    name: 'Yellow',
    range: '13–22',
    label: 'Under pressure',
    copy: 'More strain — stress, overthinking, sleep, regulation.',
    tone: 'var(--zone-yellow)',
  },
  {
    id: 'orange',
    name: 'Orange',
    range: '23–34',
    label: 'Struggling',
    copy: 'Heavier load — deeper self-help and a nudge to talk to someone.',
    tone: 'var(--zone-orange)',
  },
  {
    id: 'red',
    name: 'Red',
    range: '35–48',
    label: 'Needs human support',
    copy: 'Resources and helplines — no celebratory gamification.',
    tone: 'var(--zone-red)',
  },
] as const

export function totalRiskToZoneId(totalRisk: number): ZoneId {
  if (totalRisk <= 12) return 'green'
  if (totalRisk <= 22) return 'yellow'
  if (totalRisk <= 34) return 'orange'
  return 'red'
}

export function zoneById(id: ZoneId): ZoneMeta {
  const z = ZONES.find((x) => x.id === id)
  if (!z) return ZONES[0]
  return z
}
