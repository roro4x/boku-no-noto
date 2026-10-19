import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { HomeGlance } from './components/HomeGlance'
import { LinksDirectory } from './components/LinksDirectory'
import { VocabularyCatalog } from './components/VocabularyCatalog'
import { NotesArchive } from './components/NotesArchive'
import { PromptLibrary } from './components/PromptLibrary'
import { SeasonalAtmosphere } from './components/SeasonalAtmosphere'
import { SiteClock } from './components/SiteClock'
import { TextArchive } from './components/TextArchive'
import { Scratchpad } from './components/Scratchpad'
import { nextAvailableTrackIndex, nextTrackIndex, playlist } from './data/playlist'
import { resolveSiteLocale, siteCopy, type SiteLocale } from './i18n'

type Route =
  | { page: 'home' }
  | { page: 'words'; itemId?: string }
  | { page: 'texts'; slug?: string }
  | { page: 'notes'; slug?: string }
  | { page: 'prompts'; promptId?: string }
  | { page: 'links' }

const parseRoute = (): Route => {
  const path = (window.location.hash || '#/').slice(1).split('?')[0]
  const parts = path.split('/').filter(Boolean)
  if (parts[0] === 'texts') {
    return { page: 'texts', slug: parts[1] === 'mine' ? parts[2] : parts[1] }
  }
  if (parts[0] === 'notes') return { page: 'notes', slug: parts[1] }
  if (parts[0] === 'prompts') return { page: 'prompts', promptId: parts[1] }
  if (parts[0] === 'links') return { page: 'links' }
  if (parts[0] === 'words') return { page: 'words', itemId: parts[1] }
  return { page: 'home' }
}

const getInitialLocale = (): SiteLocale => {
  try {
    const savedLocale = window.localStorage.getItem('boku-no-noto-locale')
    return resolveSiteLocale(savedLocale)
  } catch {
    return 'ja'
  }
}

const formatPlayerTime = (seconds: number) => {
  if (!Number.isFinite(seconds)) return '00:00'
  const minutes = Math.floor(seconds / 60)
  const rest = Math.floor(seconds % 60)
  return `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`
}

function App() {
  const [route, setRoute] = useState(parseRoute)
  const [locale, setLocale] = useState<SiteLocale>(getInitialLocale)
  const copy = siteCopy[locale]
  const routeKey = route.page + ('itemId' in route ? `/${route.itemId ?? ''}`
    : 'slug' in route ? `/${route.slug ?? ''}` : 'promptId' in route ? `/${route.promptId ?? ''}` : '')
  const scrollPositions = useRef(new Map<string, number>())

  useLayoutEffect(() => {
    let frame = 0
    let attempts = 0
    let restoring = true
    let lastPosition = scrollPositions.current.get(routeKey) ?? 0
    const restore = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight
      if (lastPosition > maxScroll && attempts++ < 120) {
        frame = window.requestAnimationFrame(restore)
        return
      }
      document.getElementById('main-content')?.focus({ preventScroll: true })
      window.scrollTo({ top: lastPosition, behavior: 'instant' })
      restoring = false
    }
    frame = window.requestAnimationFrame(restore)
    const remember = () => { if (!restoring) lastPosition = window.scrollY }
    window.addEventListener('scroll', remember, { passive: true })
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', remember)
      scrollPositions.current.set(routeKey, lastPosition)
    }
  }, [routeKey])

  useEffect(() => {
    const updateRoute = () => setRoute(parseRoute())
    window.addEventListener('hashchange', updateRoute)
    return () => window.removeEventListener('hashchange', updateRoute)
  }, [])

  useEffect(() => {
    document.title = route.page === 'texts'
      ? `${copy.textsTitle} · 僕のノート`
      : route.page === 'notes'
        ? `${copy.notesTitle} · 僕のノート`
      : route.page === 'prompts'
        ? `${copy.promptsNav} · 僕のノート`
        : route.page === 'links'
          ? `${copy.linksNav} · 僕のノート`
      : route.page === 'words'
        ? `${copy.wordsNav} · 僕のノート`
        : '僕のノート · Boku no Nōto'
  }, [copy.wordsNav, copy.linksNav, copy.notesTitle, copy.promptsNav, copy.textsTitle, route.page])

  useEffect(() => {
    document.documentElement.lang = copy.htmlLang
    try {
      window.localStorage.setItem('boku-no-noto-locale', locale)
    } catch {
      // The language still works for this visit when storage is unavailable.
    }
  }, [copy.htmlLang, locale])

  return (
    <>
      <a
        className="skip-link"
        href="#main-content"
        onClick={(event) => {
          event.preventDefault()
          document.getElementById('main-content')?.focus()
        }}
      >
        {copy.skip}
      </a>

      <div className="season-watermark" aria-hidden="true" />
      <div className={`page-shell${route.page !== 'home' ? ' page-shell--inner' : ''}`}>
        <header className="site-header" aria-labelledby="site-title">
          <div className="pond-window">
            <img
              className="frog-mascot"
              src={`${import.meta.env.BASE_URL}assets/frog/frog-notebook.png`}
              width="512"
              height="512"
              alt={copy.frogAlt}
            />
          </div>
          <div className="header-copy">
            <h1 id="site-title" lang="ja">
              <a href="#/">僕のノート</a>
            </h1>
            <p className="header-roman" lang="en">Boku no Nōto</p>
            <p className="header-description" lang="ja">ぼくの小さなホームページ</p>
          </div>
            <fieldset className="language-switcher" aria-label={copy.languageTitle}>
              <button type="button" lang="ru" aria-label={copy.russianLanguage}
                aria-pressed={locale === 'ru'} onClick={() => setLocale('ru')}>RU</button>
              <button type="button" lang="ja" aria-label={copy.japaneseLanguage}
                aria-pressed={locale === 'ja'} onClick={() => setLocale('ja')}>日本語</button>
            </fieldset>
        </header>

        <div className="marquee-strip" aria-label={copy.siteStatus}>
          <span lang="ja">このホームページは工事中です</span>
        </div>

        <div className="page-grid">
          <nav className="nav-board" aria-label={copy.mainNavigation}>
              <h2 lang={locale}>{copy.navigationTitle}</h2>
              <ul>
                <li>
                  <a href="#/" aria-current={route.page === 'home' ? 'page' : undefined}>
                    <span className="nav-marker" aria-hidden="true" /> {copy.homeNav}
                  </a>
                </li>
                <li>
                  <a
                    href="#/words"
                    aria-current={route.page === 'words' ? 'page' : undefined}
                  >
                    <span className="nav-marker" aria-hidden="true" /> {copy.wordsNav}
                  </a>
                </li>
                <li>
                  <a
                    href="#/texts"
                    aria-current={route.page === 'texts' ? 'page' : undefined}
                  >
                    <span className="nav-marker" aria-hidden="true" /> {copy.textsNav}
                  </a>
                </li>
                <li>
                  <a
                    href="#/notes"
                    aria-current={route.page === 'notes' ? 'page' : undefined}
                  >
                    <span className="nav-marker" aria-hidden="true" /> {copy.notesNav}
                  </a>
                </li>
                <li>
                  <a
                    href="#/prompts"
                    aria-current={route.page === 'prompts' ? 'page' : undefined}
                  >
                    <span className="nav-marker" aria-hidden="true" /> {copy.promptsNav}
                  </a>
                </li>
                <li>
                  <a
                    href="#/links"
                    aria-current={route.page === 'links' ? 'page' : undefined}
                  >
                    <span className="nav-marker" aria-hidden="true" /> {copy.linksNav}
                  </a>
                </li>
              </ul>
          </nav>

          <main id="main-content" className="main-content" tabIndex={-1}>
            {route.page === 'home' && (
              <>
                <Home locale={locale} />
                <GuestNote locale={locale} />
              </>
            )}
            {route.page === 'words' && (
              <VocabularyCatalog key={route.itemId ?? "list"} itemId={route.itemId} locale={locale} />
            )}
            {route.page === 'texts' && (
              <TextArchive slug={route.slug} locale={locale} />
            )}
            {route.page === 'notes' && <NotesArchive slug={route.slug} locale={locale} />}
            {route.page === 'prompts' && (
              <PromptLibrary promptId={route.promptId} locale={locale} />
            )}
            {route.page === 'links' && <LinksDirectory locale={locale} />}
          </main>

          <aside className="sidebar" aria-label={copy.sidebar}>

            <SiteClock locale={locale} />

            <SeasonalAtmosphere locale={locale} />

            <MusicPlayer locale={locale} />

            <div className="mini-banners" aria-label={copy.decorativeBanners}>
              <span className="mini-banner mini-banner--green">HAND MADE</span>
              <span className="mini-banner mini-banner--blue" lang="ja">
                日本語勉強中
              </span>
            </div>
          </aside>
        </div>

        <footer className="site-footer">
          <div className="footer-signature">
            <a className="footer-brand" href="#/" lang="ja">僕のノート</a>
            <p className="footer-note">{copy.footerMade}</p>
          </div>
          <p className="footer-copyright">© {new Date().getFullYear()} Boku no Nōto</p>
        </footer>
      </div>
      <Scratchpad locale={locale} />
    </>
  )
}

function GuestNote({ locale }: { locale: SiteLocale }) {
  const copy = siteCopy[locale]
  return (
    <section className="guest-note" aria-label={copy.guestNoteLabel}>
      <p>{copy.guestNote}</p>
      <img
        className="pond-divider"
        src={`${import.meta.env.BASE_URL}assets/frog/pond-divider.png`}
        width="800"
        height="289"
        alt=""
      />
    </section>
  )
}

function Home({ locale }: { locale: SiteLocale }) {
  const copy = siteCopy[locale]
  return (
    <section className="welcome-note" aria-labelledby="welcome-title">
      <h2 id="welcome-title">{copy.welcomeTitle}</h2>
      <p>
        {locale === 'ru' && <><span lang="ja">いらっしゃいませ！</span>{' '}</>}
        {copy.welcomeBody}
      </p>
      <HomeGlance locale={locale} />
    </section>
  )
}

function MusicPlayer({ locale }: { locale: SiteLocale }) {
  const copy = siteCopy[locale]
  const audioRef = useRef<HTMLAudioElement>(null)
  const displayRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(35)
  const [hasError, setHasError] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0)
  const [displayMode, setDisplayMode] = useState<'time' | 'track'>('time')
  const [isDisplayVisible, setIsDisplayVisible] = useState(true)
  const wantsPlaybackRef = useRef(false)
  const failedTracksRef = useRef(new Set<number>())
  const currentTrack = playlist[currentTrackIndex]
  const isEmpty = playlist.length === 0
  const hasPlayerNotice = isEmpty || hasError

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume / 100
  }, [volume])

  useEffect(() => () => {
    wantsPlaybackRef.current = false
    audioRef.current?.pause()
  }, [])

  useEffect(() => {
    const display = displayRef.current
    if (!display || typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver(
      ([entry]) => setIsDisplayVisible(entry.isIntersecting),
      { threshold: 0.1 },
    )
    observer.observe(display)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!currentTrack || !isDisplayVisible) {
      setDisplayMode('time')
      return
    }

    const interval = window.setInterval(() => {
      setDisplayMode((mode) => mode === 'time' ? 'track' : 'time')
    }, 6000)
    return () => window.clearInterval(interval)
  }, [currentTrack, isDisplayVisible])

  const handleTrackFailure = useCallback(() => {
    setIsPlaying(false)
    setIsLoading(false)

    if (!wantsPlaybackRef.current) {
      setHasError(true)
      return
    }

    const failedTracks = new Set(failedTracksRef.current)
    failedTracks.add(currentTrackIndex)
    failedTracksRef.current = failedTracks
    const nextIndex = nextAvailableTrackIndex(
      currentTrackIndex,
      playlist.length,
      failedTracks,
    )

    if (nextIndex === null) {
      wantsPlaybackRef.current = false
      setHasError(true)
      return
    }

    setHasError(false)
    setCurrentTrackIndex(nextIndex)
  }, [currentTrackIndex])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !currentTrack || !wantsPlaybackRef.current) return

    let cancelled = false
    setCurrentTime(0)
    setDuration(0)
    setIsLoading(true)
    audio.load()

    void audio.play()
      .then(() => {
        if (cancelled) return
        setHasError(false)
        setIsLoading(false)
      })
      .catch(() => {
        if (!cancelled) handleTrackFailure()
      })

    return () => {
      cancelled = true
    }
  }, [currentTrack, handleTrackFailure])

  const togglePlayback = async () => {
    const audio = audioRef.current
    if (!audio || !currentTrack) return

    if (isPlaying) {
      wantsPlaybackRef.current = false
      audio.pause()
      return
    }

    wantsPlaybackRef.current = true
    failedTracksRef.current.clear()
    setHasError(false)
    setIsLoading(true)

    try {
      if (hasError) audio.load()
      await audio.play()
      setIsLoading(false)
    } catch {
      handleTrackFailure()
    }
  }

  const playNextTrack = (audio: HTMLAudioElement) => {
    const nextIndex = nextTrackIndex(currentTrackIndex, playlist.length)
    if (nextIndex === null) return

    failedTracksRef.current.clear()
    setCurrentTime(0)
    if (nextIndex === currentTrackIndex) {
      audio.currentTime = 0
      setIsLoading(true)
      void audio.play()
        .then(() => setIsLoading(false))
        .catch(handleTrackFailure)
      return
    }

    setCurrentTrackIndex(nextIndex)
  }

  const changeTrack = (direction: 'previous' | 'next') => {
    const audio = audioRef.current
    if (!audio || playlist.length === 0) return

    const targetIndex = direction === 'next'
      ? nextTrackIndex(currentTrackIndex, playlist.length)
      : (currentTrackIndex - 1 + playlist.length) % playlist.length
    if (targetIndex === null) return

    failedTracksRef.current.clear()
    setHasError(false)
    setCurrentTime(0)

    if (targetIndex === currentTrackIndex) {
      audio.currentTime = 0
      if (wantsPlaybackRef.current) {
        setIsLoading(true)
        void audio.play()
          .then(() => setIsLoading(false))
          .catch(handleTrackFailure)
      }
      return
    }

    setDuration(0)
    setCurrentTrackIndex(targetIndex)
  }

  return (
    <section
      className="side-box player-box"
      aria-busy={isLoading}
      aria-labelledby="player-title"
    >
      <h2 id="player-title" lang={locale}>{copy.musicTitle}</h2>
      <div className="player-display">
        <div
          className="player-display__readout"
          ref={displayRef}
          aria-label={currentTrack
            ? `${currentTrack.title}. ${formatPlayerTime(currentTime)} / ${formatPlayerTime(duration)}`
            : copy.audioEmpty}
        >
          {!currentTrack ? (
            <span className="player-display__time" aria-hidden="true">NO TAPE</span>
          ) : displayMode === 'time' ? (
            <span className="player-display__time" aria-hidden="true">
              {formatPlayerTime(currentTime)} / {formatPlayerTime(duration)}
            </span>
          ) : (
            <span className="player-display__track" title={currentTrack.title} aria-hidden="true">
              <span>{currentTrack.title}</span>
            </span>
          )}
        </div>
      </div>
      <label className="player-volume">
        <span>{copy.volume}</span>
        <input
          type="range"
          min="0"
          max="100"
          value={volume}
          aria-label={copy.volumeLabel}
          onChange={(event) => setVolume(Number(event.target.value))}
        />
      </label>
      <div className="player-controls" aria-describedby={hasPlayerNotice ? 'player-note' : undefined}>
        <button
          className="player-skip"
          type="button"
          onClick={() => changeTrack('previous')}
          disabled={isEmpty || isLoading}
          aria-label={copy.previousTrackLabel}
        >
          <span className="player-skip-icon player-skip-icon--previous" aria-hidden="true" />
        </button>
        <button
          className="player-toggle"
          type="button"
          onClick={togglePlayback}
          disabled={isEmpty || isLoading}
          aria-label={isPlaying ? copy.pauseLabel : hasError ? copy.retryAudio : copy.playLabel}
        >
          <span
            className={`player-control-icon ${isPlaying ? 'player-control-icon--pause' : 'player-control-icon--play'}`}
            aria-hidden="true"
          >
            {isPlaying && <><i /><i /></>}
          </span>
        </button>
        <button
          className="player-skip"
          type="button"
          onClick={() => changeTrack('next')}
          disabled={isEmpty || isLoading}
          aria-label={copy.nextTrackLabel}
        >
          <span className="player-skip-icon" aria-hidden="true" />
        </button>
      </div>
      <span className="visually-hidden" role="status" aria-live="polite" aria-atomic="true">
        {isLoading ? copy.audioLoading : ''}
      </span>
      {hasPlayerNotice && (
        <p id="player-note" role="status" aria-live="polite">
          {isEmpty ? copy.audioEmpty : copy.audioError}
        </p>
      )}
      {currentTrack && (
        <audio
          ref={audioRef}
          preload="metadata"
          src={`${import.meta.env.BASE_URL}${currentTrack.file}`}
          onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
          onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
          onPlay={() => {
            setIsPlaying(true)
            setIsLoading(false)
            setHasError(false)
          }}
          onPause={() => setIsPlaying(false)}
          onEnded={(event) => playNextTrack(event.currentTarget)}
          onError={handleTrackFailure}
        />
      )}
    </section>
  )
}

export default App
