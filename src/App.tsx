import { useCallback, useEffect, useRef, useState } from 'react'
import { LinksDirectory } from './components/LinksDirectory'
import { NihongoCatalog } from './components/NihongoCatalog'
import { NotesArchive } from './components/NotesArchive'
import { PromptLibrary } from './components/PromptLibrary'
import { TextArchive } from './components/TextArchive'
import { nextAvailableTrackIndex, nextTrackIndex, playlist } from './data/playlist'
import { categories, type StudyCategory } from './data/study'
import { resolveSiteLocale, siteCopy, type SiteLocale } from './i18n'

type Route =
  | { page: 'home' }
  | { page: 'nihongo'; category: StudyCategory; itemId?: string }
  | { page: 'texts'; category: 'mine' | 'reading'; slug?: string }
  | { page: 'notes'; slug?: string }
  | { page: 'prompts'; promptId?: string }
  | { page: 'links' }

const parseRoute = (): Route => {
  const path = (window.location.hash || '#/').slice(1).split('?')[0]
  const parts = path.split('/').filter(Boolean)
  if (parts[0] === 'texts') {
    if (parts[1] === 'reading') return { page: 'texts', category: 'reading', slug: parts[2] }
    if (parts[1] === 'mine') return { page: 'texts', category: 'mine', slug: parts[2] }
    return { page: 'texts', category: 'mine', slug: parts[1] }
  }
  if (parts[0] === 'notes') return { page: 'notes', slug: parts[1] }
  if (parts[0] === 'prompts') return { page: 'prompts', promptId: parts[1] }
  if (parts[0] === 'links') return { page: 'links' }
  if (parts[0] !== 'nihongo') return { page: 'home' }
  const category = categories.some((item) => item.id === parts[1])
    ? (parts[1] as StudyCategory)
    : 'grammar'
  return { page: 'nihongo', category, itemId: parts[2] }
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
      : route.page === 'nihongo'
        ? '日本語 · N5 · 僕のノート'
        : '僕のノート · Boku no Nōto'
  }, [copy.linksNav, copy.notesTitle, copy.promptsNav, copy.textsTitle, route.page])

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

      <div className="page-shell">
        <header className="site-header" aria-labelledby="site-title">
          <div className="header-copy">
            <h1 id="site-title" lang="ja">
              僕のノート
            </h1>
            <p className="header-roman">
              <span lang="ja">ぼくの小さなホームページ</span> · Boku no Nōto
            </p>
          </div>

          <div className="pond-window">
            <img
              className="frog-mascot"
              src={`${import.meta.env.BASE_URL}assets/frog/frog-notebook.png`}
              width="512"
              height="512"
              alt={copy.frogAlt}
            />
            <span className="pond-caption" lang="ja">僕のノートへようこそ！</span>
          </div>
        </header>

        <div className="marquee-strip" aria-label={copy.siteStatus}>
          <span aria-hidden="true">◆</span>
          <span lang="ja">このホームページは工事中です</span>
          <span aria-hidden="true">◆</span>
        </div>

        <div className="page-grid">
          <nav className="nav-board" aria-label={copy.mainNavigation}>
              <h2 lang="ja">メニュー</h2>
              <ul>
                <li>
                  <a href="#/" aria-current={route.page === 'home' ? 'page' : undefined}>
                    <span className="nav-marker" aria-hidden="true" /> {copy.homeNav}
                  </a>
                </li>
                <li>
                  <a
                    href="#/nihongo/grammar"
                    aria-current={route.page === 'nihongo' ? 'page' : undefined}
                  >
                    <span className="nav-marker" aria-hidden="true" /> 日本語 · N5
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
            {route.page === 'nihongo' && (
              <NihongoCatalog category={route.category} itemId={route.itemId} locale={locale} />
            )}
            {route.page === 'texts' && (
              <TextArchive category={route.category} slug={route.slug} locale={locale} />
            )}
            {route.page === 'notes' && <NotesArchive slug={route.slug} locale={locale} />}
            {route.page === 'prompts' && (
              <PromptLibrary promptId={route.promptId} locale={locale} />
            )}
            {route.page === 'links' && <LinksDirectory locale={locale} />}
          </main>

          <aside className="sidebar" aria-label={copy.sidebar}>

            <MusicPlayer locale={locale} />

            <section className="side-box site-info" aria-labelledby="about-title">
              <h2 id="about-title">{copy.aboutTitle}</h2>
              <fieldset className="language-switcher">
                <legend>{copy.languageLegend}</legend>
                <div>
                  <button
                    type="button"
                    aria-label={copy.russianLanguage}
                    aria-pressed={locale === 'ru'}
                    onClick={() => setLocale('ru')}
                  >
                    RU
                  </button>
                  <button
                    type="button"
                    lang="ja"
                    aria-label={copy.japaneseLanguage}
                    aria-pressed={locale === 'ja'}
                    onClick={() => setLocale('ja')}
                  >
                    日本語
                  </button>
                </div>
              </fieldset>
            </section>

            <div className="mini-banners" aria-label={copy.decorativeBanners}>
              <span className="mini-banner mini-banner--green">HAND MADE</span>
              <span className="mini-banner mini-banner--blue" lang="ja">
                日本語勉強中
              </span>
            </div>
          </aside>
        </div>

        <footer className="site-footer">
          <p>
            <span lang="ja">僕のノート</span> · {copy.footerMade}
          </p>
          <p>
            <a href="#/">{copy.footerHome}</a>
          </p>
        </footer>
      </div>
    </>
  )
}

function GuestNote({ locale }: { locale: SiteLocale }) {
  const copy = siteCopy[locale]
  return (
    <section className="guest-note" aria-label={copy.guestNoteLabel}>
      <div>
        <span className="guest-note__stamp" aria-hidden="true">文</span>
        <p>{copy.guestNote}</p>
      </div>
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
      <div className="paper-pin" aria-hidden="true" />
      <h2 id="welcome-title">{copy.welcomeTitle}</h2>
      <p>
        {locale === 'ru' && <><span lang="ja">いらっしゃいませ！</span>{' '}</>}
        {copy.welcomeBody}
      </p>
      <div className="home-signs">
        <a className="nihongo-sign" href="#/nihongo/grammar">
          <span lang="ja">日本語のノート</span>
          <small>{copy.openN5}</small>
        </a>
        <a className="nihongo-sign nihongo-sign--paper" href="#/texts">
          <span lang={locale}>{copy.textsTitle}</span>
          <small>{copy.openTexts}</small>
        </a>
      </div>
    </section>
  )
}

function MusicPlayer({ locale }: { locale: SiteLocale }) {
  const copy = siteCopy[locale]
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(35)
  const [hasError, setHasError] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0)
  const wantsPlaybackRef = useRef(false)
  const failedTracksRef = useRef(new Set<number>())
  const currentTrack = playlist[currentTrackIndex]
  const isEmpty = playlist.length === 0

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume / 100
  }, [volume])

  useEffect(() => () => {
    wantsPlaybackRef.current = false
    audioRef.current?.pause()
  }, [])

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

  return (
    <section className="side-box player-box" aria-labelledby="player-title">
      <h2 id="player-title" lang="ja">おんがく</h2>
      <div className="player-display">
        <span title={currentTrack?.title}>{currentTrack?.display ?? 'NO TAPE'}</span>
        <span>{formatPlayerTime(currentTime)} / {formatPlayerTime(duration)}</span>
      </div>
      <div className="player-tape" aria-hidden="true">
        <span />
        <span />
      </div>
      <div className="player-controls" aria-describedby="player-note">
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
          {hasError ? copy.retryAudio : isPlaying ? copy.pause : copy.play}
        </button>
        <label>
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
      </div>
      <p id="player-note" role="status" aria-live="polite">
        {isEmpty
          ? copy.audioEmpty
          : hasError
            ? copy.audioError
            : isLoading
              ? copy.audioLoading
              : copy.audioReady(currentTrack.title)}
      </p>
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
