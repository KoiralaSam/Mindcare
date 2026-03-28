/** Turn API `age_group` keys into short labels for the summary screen. */
export function formatAgeGroupLabel(ageGroup: string): string {
  const key = ageGroup.trim().toLowerCase().replace(/\s+/g, '_')
  const map: Record<string, string> = {
    teen: 'Teen',
    young_adult: 'Young adult',
    adult: 'Adult',
    senior: 'Senior',
  }
  if (map[key]) return map[key]
  return ageGroup
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}
