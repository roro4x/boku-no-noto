import { describe, expect, it } from 'vitest'
import { nextAvailableTrackIndex, nextTrackIndex } from './playlist'

describe('playlist navigation', () => {
  it('loops from the final track back to the first', () => {
    expect(nextTrackIndex(0, 3)).toBe(1)
    expect(nextTrackIndex(2, 3)).toBe(0)
    expect(nextTrackIndex(0, 1)).toBe(0)
    expect(nextTrackIndex(0, 0)).toBeNull()
  })

  it('skips failed tracks without retrying forever', () => {
    expect(nextAvailableTrackIndex(0, 3, new Set([1]))).toBe(2)
    expect(nextAvailableTrackIndex(2, 3, new Set([0]))).toBe(1)
    expect(nextAvailableTrackIndex(0, 2, new Set([0, 1]))).toBeNull()
  })
})
