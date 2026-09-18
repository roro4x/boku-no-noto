export type PlaylistTrack = {
  id: string
  title: string
  display: string
  file: string
}

export const playlist: PlaylistTrack[] = [
  {
    id: 'mirostar-lofi-beats',
    title: 'Mirostar — Lofi Beats',
    display: 'LOFI',
    file: 'audio/mirostar-lofi-beats-531504.mp3',
  },
]

export const nextTrackIndex = (currentIndex: number, trackCount: number) =>
  trackCount > 0 ? (currentIndex + 1) % trackCount : null

export const nextAvailableTrackIndex = (
  currentIndex: number,
  trackCount: number,
  failedIndexes: ReadonlySet<number>,
) => {
  if (trackCount <= 0 || failedIndexes.size >= trackCount) return null

  for (let offset = 1; offset <= trackCount; offset += 1) {
    const candidate = (currentIndex + offset) % trackCount
    if (!failedIndexes.has(candidate)) return candidate
  }

  return null
}
