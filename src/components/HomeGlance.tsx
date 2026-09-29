import { useEffect, useState } from 'react'
import {
  pickRandomVocabulary,
  splitMeaningParts,
} from '../data/homeGlance'
import type { VocabularyItem } from '../data/study'
import type { SiteLocale } from '../i18n'

type HomeGlanceProps = {
  locale: SiteLocale
}

const previousWordKey = 'boku-no-noto-previous-random-word'
let visitWordId: string | null = null

const glanceCopy = {
  ru: {
    wordTitle: 'Случайное слово',
    wordLoading: 'Открываю словарь…',
    wordError: 'Словарь сейчас не открылся.',
    meaningLabel: 'Варианты перевода',
    wordLink: (term: string) => `Открыть слово «${term}» в словаре N5`,
  },
  ja: {
    wordTitle: 'ランダムな言葉',
    wordLoading: '辞書を開いています…',
    wordError: '今、辞書を開けません。',
    meaningLabel: 'ロシア語訳',
    wordLink: (term: string) => `「${term}」をN5辞書で開く`,
  },
} as const

const getPreviousWordId = () => {
  try {
    return window.sessionStorage.getItem(previousWordKey)
  } catch {
    return null
  }
}

const rememberWordId = (id: string) => {
  try {
    window.sessionStorage.setItem(previousWordKey, id)
  } catch {
    // Random vocabulary still works when session storage is unavailable.
  }
}

export function HomeGlance({ locale }: HomeGlanceProps) {
  const copy = glanceCopy[locale]
  const [word, setWord] = useState<VocabularyItem | null>(null)
  const [wordState, setWordState] = useState<'loading' | 'ready' | 'error'>('loading')
  const meaningParts = word ? splitMeaningParts(word.meaningsRu[0]) : []

  useEffect(() => {
    let active = true
    fetch(`${import.meta.env.BASE_URL}data/n5/vocabulary.json`)
      .then((response) => {
        if (!response.ok) throw new Error('vocabulary')
        return response.json() as Promise<VocabularyItem[]>
      })
      .then((items) => {
        if (!active) return
        let nextWord = visitWordId
          ? items.find((item) => item.id === visitWordId) ?? null
          : null
        if (!nextWord) {
          nextWord = pickRandomVocabulary(items, getPreviousWordId())
          if (nextWord) {
            visitWordId = nextWord.id
            rememberWordId(nextWord.id)
          }
        }
        if (!nextWord) throw new Error('empty vocabulary')
        setWord(nextWord)
        setWordState('ready')
      })
      .catch(() => {
        if (active) setWordState('error')
      })
    return () => {
      active = false
    }
  }, [])

  return (
    <div className="home-glance">
      <section className="home-glance__word" aria-labelledby="random-word-title">
        <h3 id="random-word-title">{copy.wordTitle}</h3>
        <div className="home-glance__word-body" aria-live="polite">
          {wordState === 'loading' && <p className="home-glance__notice">{copy.wordLoading}</p>}
          {wordState === 'error' && <p className="home-glance__notice">{copy.wordError}</p>}
          {wordState === 'ready' && word && (
            <>
              <a
                className="home-glance__term"
                href={`#/nihongo/vocabulary/${encodeURIComponent(word.id)}`}
                lang="ja"
                aria-label={copy.wordLink(word.term)}
              >
                {word.term}
              </a>
              {word.reading !== word.term && <span className="home-glance__reading" lang="ja">{word.reading}</span>}
              <ul className="home-glance__meanings" lang="ru" aria-label={copy.meaningLabel}>
                {meaningParts.map((meaning, index) => (
                  <li key={`${meaning}-${index}`}>{meaning}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      </section>
    </div>
  )
}
