export type Season = 'winter' | 'spring' | 'summer' | 'autumn'

export const resolveSeason = (date: Date): Season => {
  const month = date.getMonth()

  if (month === 11 || month <= 1) return 'winter'
  if (month <= 4) return 'spring'
  if (month <= 7) return 'summer'
  return 'autumn'
}
