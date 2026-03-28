import type { CSSProperties } from 'react'

export type ZoneId = 'green' | 'yellow' | 'orange' | 'red'

export type ZoneMeta = {
  id: ZoneId
  name: string
  range: string
  label: string
  copy: string
  tone: string
}

export const ZONES: ZoneMeta[] = [
  {
    id: 'green',
    name: 'Green',
    range: '39–48',
    label: 'Steady',
    copy: 'Things feel manageable most of the time.',
    tone: 'var(--zone-green)',
  },
  {
    id: 'yellow',
    name: 'Yellow',
    range: '29–38',
    label: 'Wobbly',
    copy: 'Some strain — worth extra care and check-ins.',
    tone: 'var(--zone-yellow)',
  },
  {
    id: 'orange',
    name: 'Orange',
    range: '19–28',
    label: 'Heavy',
    copy: 'Support and pacing matter — consider trusted help.',
    tone: 'var(--zone-orange)',
  },
  {
    id: 'red',
    name: 'Red',
    range: '0–18',
    label: 'Crisis-aware',
    copy: 'Human support first — this app is not enough on its own.',
    tone: 'var(--zone-red)',
  },
]

export function zoneById(id: ZoneId | null | undefined): ZoneMeta | null {
  if (!id) return null
  return ZONES.find((z) => z.id === id) ?? null
}

export function zoneStyle(tone: string): CSSProperties {
  return { '--zone': tone } as CSSProperties
}
