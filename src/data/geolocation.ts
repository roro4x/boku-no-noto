import { throwIfAborted } from './abort'

export type Coordinates = { latitude: number; longitude: number }

export const isPermissionDenied = (error: unknown) =>
  typeof error === 'object' && error !== null && 'code' in error && error.code === 1

// Undefined means that device location is unavailable; weather may then use
// approximate network location. An explicit permission denial never falls back.
export const getVisitorCoordinates = (signal?: AbortSignal): Promise<Coordinates | undefined> => {
  throwIfAborted(signal)
  if (!navigator.geolocation) return Promise.resolve(undefined)

  return new Promise((resolve, reject) => {
    let finished = false
    let timer: ReturnType<typeof setTimeout> | undefined
    const finish = (coordinates?: Coordinates, error?: unknown) => {
      if (finished) return
      finished = true
      clearTimeout(timer)
      signal?.removeEventListener('abort', cancel)
      if (error !== undefined) reject(error)
      else resolve(coordinates)
    }
    const cancel = () => finish(undefined, signal?.reason ?? new DOMException('Cancelled', 'AbortError'))
    signal?.addEventListener('abort', cancel, { once: true })
    // Some browsers do not fire the native timeout while waiting on their
    // location service. Keep the weather control from hanging indefinitely.
    timer = setTimeout(() => finish(), 10000)
    try {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          if (!Number.isFinite(coords.latitude) || Math.abs(coords.latitude) > 90
            || !Number.isFinite(coords.longitude) || Math.abs(coords.longitude) > 180) {
            finish()
            return
          }
          finish({ latitude: coords.latitude, longitude: coords.longitude })
        },
        (error) => isPermissionDenied(error) ? finish(undefined, error) : finish(),
        { enableHighAccuracy: false, maximumAge: 15 * 60 * 1000, timeout: 10000 },
      )
    } catch (error) {
      if (isPermissionDenied(error)) finish(undefined, error)
      else finish()
    }
  })
}
