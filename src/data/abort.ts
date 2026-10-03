// Avoid AbortSignal.throwIfAborted(), which is missing in older mobile browsers.
export const throwIfAborted = (signal?: AbortSignal) => {
  if (signal?.aborted) throw signal.reason ?? new DOMException('Cancelled', 'AbortError')
}
