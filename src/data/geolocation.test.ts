import { afterEach, describe, expect, it, vi } from 'vitest'
import { getVisitorCoordinates } from './geolocation'

const position = { coords: { latitude: 55.75, longitude: 37.62 } }
const mockLocation = (getCurrentPosition: ReturnType<typeof vi.fn>) =>
  vi.stubGlobal('navigator', { geolocation: { getCurrentPosition } })

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('device location', () => {
  it('returns browser coordinates', async () => {
    mockLocation(vi.fn((success) => success(position)))
    await expect(getVisitorCoordinates()).resolves.toEqual(position.coords)
  })

  it.each([2, 3])('allows approximate weather when location fails with code %s', async (code) => {
    mockLocation(vi.fn((_success, failure) => failure({ code })))
    await expect(getVisitorCoordinates()).resolves.toBeUndefined()
  })

  it('does not fall back after an explicit permission denial', async () => {
    mockLocation(vi.fn((_success, failure) => failure({ code: 1 })))
    await expect(getVisitorCoordinates()).rejects.toEqual({ code: 1 })
  })

  it('allows approximate weather when geolocation is missing', async () => {
    vi.stubGlobal('navigator', {})
    await expect(getVisitorCoordinates()).resolves.toBeUndefined()
  })

  it('bounds a location service that never calls back, and ignores late results', async () => {
    vi.useFakeTimers()
    const getPosition = vi.fn()
    mockLocation(getPosition)
    const pending = getVisitorCoordinates()
    await vi.advanceTimersByTimeAsync(10000)
    await expect(pending).resolves.toBeUndefined()
    getPosition.mock.calls[0][0](position)
    await expect(pending).resolves.toBeUndefined()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('cancels location lookup when weather is turned off', async () => {
    vi.useFakeTimers()
    mockLocation(vi.fn())
    const controller = new AbortController()
    const pending = getVisitorCoordinates(controller.signal)
    controller.abort()
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' })
    expect(vi.getTimerCount()).toBe(0)
  })

  it('rejects invalid coordinates instead of querying the wrong place', async () => {
    mockLocation(vi.fn((success) => success({ coords: { latitude: 91, longitude: 37 } })))
    await expect(getVisitorCoordinates()).resolves.toBeUndefined()
  })
})
