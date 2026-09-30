import { describe, expect, it } from 'vitest'
import { resolveSeason } from './season'

describe('resolveSeason', () => {
  it.each([
    [new Date(2026, 11, 1), 'winter'],
    [new Date(2026, 1, 28), 'winter'],
    [new Date(2026, 2, 1), 'spring'],
    [new Date(2026, 4, 31), 'spring'],
    [new Date(2026, 5, 1), 'summer'],
    [new Date(2026, 7, 31), 'summer'],
    [new Date(2026, 8, 1), 'autumn'],
    [new Date(2026, 10, 30), 'autumn'],
  ] as const)('maps %s to %s', (date, expected) => {
    expect(resolveSeason(date)).toBe(expected)
  })
})
