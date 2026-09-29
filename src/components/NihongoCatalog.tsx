import { useEffect, useMemo, useState } from 'react'
import {
  categories,
  filterVocabularyByLesson,
  isGrammarItem,
  isVocabularyItem,
  searchStudyItems,
  type StudyCategory,
  type StudyItem,
  type VocabularyItem,
  type VocabularyLessonFilter,
} from '../data/study'
import type { SiteLocale } from '../i18n'

type Manifest = {
  datasetVersion: string
  categories: Record<StudyCategory, number>
}

type NihongoCatalogProps = {
  category: StudyCategory
  itemId?: string
  locale: SiteLocale
}

const wordsRu = (count: number) => {
  const mod100 = count % 100
  const mod10 = count % 10
  if (mod100 >= 11 && mod100 <= 14) return 'слов'
  if (mod10 === 1) return 'слово'
  if (mod10 >= 2 && mod10 <= 4) return 'слова'
  return 'слов'
}

const catalogCopy = {
  ru: {
    loading: 'Открываю учебную папку…',
    error: 'Учебные данные не открылись.',
    retry: 'Попробовать снова',
    categories: 'Категории N5',
    back: '← к списку',
    search: (category: string) => `Поиск в категории «${category}»`,
    placeholder: '日本語, чтение или перевод',
    clear: 'Очистить',
    found: (count: number) => `Найдено: ${count}`,
    empty: 'В этой части папки ничего не найдено.',
    clearSearch: 'Очистить поиск',
    showMore: 'Показать ещё 40',
    dataset: (version: string) => `Набор ${version}. Это открытый учебный ориентир N5, а не официальный перечень JLPT.`,
    sources: 'Источники и лицензии',
    partOfSpeech: 'Часть речи',
    onyomi: 'Онъёми',
    kunyomi: 'Кунъёми',
    wordExamples: 'Примеры слов',
    details: 'Подробнее',
    lessonFilter: 'Урок Minna no Nihongo',
    allLessons: 'Все уроки и дополнительные слова',
    lesson: (lesson: number, count: number) => `Урок ${lesson} — ${count} ${wordsRu(count)}`,
    extraLesson: (count: number) => `Дополнительные N5 — ${count} ${wordsRu(count)}`,
    lessonFact: 'Урок',
    extraFact: 'Дополнительная лексика N5',
  },
  ja: {
    loading: '教材を開いています…',
    error: '教材データを読み込めませんでした。',
    retry: 'もう一度試す',
    categories: 'N5のカテゴリー',
    back: '← 一覧へ',
    search: (category: string) => `「${category}」を検索`,
    placeholder: '日本語・読み方・ロシア語訳',
    clear: 'クリア',
    found: (count: number) => `${count}件`,
    empty: 'このカテゴリーでは見つかりませんでした。',
    clearSearch: '検索をクリア',
    showMore: '次の40件を表示',
    dataset: (version: string) => `データセット ${version}。N5学習のための公開資料で、JLPT公式リストではありません。`,
    sources: '出典とライセンス',
    partOfSpeech: '品詞',
    onyomi: '音読み',
    kunyomi: '訓読み',
    wordExamples: '言葉の例',
    details: '詳しく見る',
    lessonFilter: 'みんなの日本語の課',
    allLessons: '全課と追加語彙',
    lesson: (lesson: number, count: number) => `第${lesson}課 — ${count}語`,
    extraLesson: (count: number) => `N5追加語彙 — ${count}語`,
    lessonFact: '課',
    extraFact: 'N5追加語彙',
  },
} as const

const categoryFile: Record<StudyCategory, string> = {
  grammar: 'grammar.json',
  vocabulary: 'vocabulary.json',
  kanji: 'kanji.json',
}

const categoryHeading = (category: StudyCategory) =>
  categories.find((item) => item.id === category) ?? categories[0]

const parseLessonFilter = (value: string | null): VocabularyLessonFilter => {
  if (value === 'extra') return 'extra'
  const lesson = Number(value)
  return Number.isInteger(lesson) && lesson >= 1 && lesson <= 25 ? lesson : 'all'
}

const routeFor = (
  category: StudyCategory,
  itemId?: string,
  query = '',
  lesson: VocabularyLessonFilter = 'all',
) => {
  const params = new URLSearchParams()
  if (query) params.set('q', query)
  if (category === 'vocabulary' && lesson !== 'all') params.set('lesson', String(lesson))
  const suffix = params.size ? `?${params.toString()}` : ''
  return `#/nihongo/${category}${itemId ? `/${encodeURIComponent(itemId)}` : ''}${suffix}`
}

export function NihongoCatalog({ category, itemId, locale }: NihongoCatalogProps) {
  const params = new URLSearchParams(window.location.hash.split('?')[1] ?? '')
  const [query, setQuery] = useState(params.get('q') ?? '')
  const [lesson, setLesson] = useState<VocabularyLessonFilter>(parseLessonFilter(params.get('lesson')))
  const [items, setItems] = useState<StudyItem[]>([])
  const [manifest, setManifest] = useState<Manifest | null>(null)
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [visibleCount, setVisibleCount] = useState(40)
  const heading = categoryHeading(category)
  const copy = catalogCopy[locale]

  useEffect(() => {
    let active = true
    setLoadState('loading')
    Promise.all([
      fetch(`${import.meta.env.BASE_URL}data/n5/manifest.json`, { cache: 'no-store' }).then((response) => {
        if (!response.ok) throw new Error('manifest')
        return response.json() as Promise<Manifest>
      }),
      fetch(`${import.meta.env.BASE_URL}data/n5/${categoryFile[category]}`, { cache: 'no-store' }).then((response) => {
        if (!response.ok) throw new Error(category)
        return response.json() as Promise<StudyItem[]>
      }),
    ])
      .then(([nextManifest, nextItems]) => {
        if (!active) return
        setManifest(nextManifest)
        setItems(nextItems)
        setLoadState('ready')
      })
      .catch(() => {
        if (active) setLoadState('error')
      })
    return () => {
      active = false
    }
  }, [category])

  useEffect(() => {
    const routeParams = new URLSearchParams(window.location.hash.split('?')[1] ?? '')
    setQuery(routeParams.get('q') ?? '')
    setLesson(category === 'vocabulary' ? parseLessonFilter(routeParams.get('lesson')) : 'all')
  }, [category, itemId])

  useEffect(() => {
    setVisibleCount(40)
  }, [category, lesson, query])

  const lessonCounts = useMemo(() => {
    const counts = new Map<number, number>()
    let extra = 0
    for (const item of items) {
      if (!isVocabularyItem(item)) continue
      if (item.minnaLesson === null) extra += 1
      else counts.set(item.minnaLesson, (counts.get(item.minnaLesson) ?? 0) + 1)
    }
    return { counts, extra }
  }, [items])
  const lessonItems = useMemo(
    () => category === 'vocabulary' ? filterVocabularyByLesson(items, lesson) : items,
    [category, items, lesson],
  )
  const searchResults = useMemo(() => searchStudyItems(lessonItems, query), [lessonItems, query])
  const detailItem = itemId ? items.find((item) => item.id === decodeURIComponent(itemId)) : undefined

  const updateViewState = (nextQuery: string, nextLesson = lesson) => {
    window.history.replaceState(null, '', routeFor(category, undefined, nextQuery, nextLesson))
  }

  if (loadState === 'loading') {
    return (
      <section className="catalog-shell" aria-labelledby="catalog-title">
        <h2 id="catalog-title">日本語 · N5</h2>
        <div className="catalog-loading" role="status">{copy.loading}</div>
      </section>
    )
  }

  if (loadState === 'error') {
    return (
      <section className="catalog-shell" aria-labelledby="catalog-title">
        <h2 id="catalog-title">日本語 · N5</h2>
        <div className="catalog-error" role="alert">
          <p>{copy.error}</p>
          <button type="button" onClick={() => window.location.reload()}>{copy.retry}</button>
        </div>
      </section>
    )
  }

  return (
    <section className="catalog-shell" aria-labelledby="catalog-title">
      <header className="catalog-heading">
        <h2 id="catalog-title"><span lang="ja">日本語</span> · N5</h2>
      </header>

      <nav className="category-tabs" aria-label={copy.categories}>
        {categories.map((item) => (
          <a
            key={item.id}
            href={routeFor(item.id)}
            aria-current={item.id === category ? 'page' : undefined}
          >
            <span lang="ja">{item.labelJa}</span>
            {locale === 'ru' && <span>{item.label}</span>}
            <small>{manifest?.categories[item.id] ?? '—'}</small>
          </a>
        ))}
      </nav>

      {detailItem ? (
        <article className="study-detail">
          <a className="back-link" href={routeFor(category, undefined, query, lesson)}>{copy.back}</a>
          <ItemDetail item={detailItem} locale={locale} />
        </article>
      ) : (
        <>
          <div className={`study-tools${category === 'vocabulary' ? ' study-tools--vocabulary' : ''}`}>
            {category === 'vocabulary' && (
              <label className="lesson-field">
                <span>{copy.lessonFilter}</span>
                <select
                  value={lesson}
                  onChange={(event) => {
                    const nextLesson = parseLessonFilter(event.target.value)
                    setLesson(nextLesson)
                    updateViewState(query, nextLesson)
                  }}
                >
                  <option value="all">{copy.allLessons}</option>
                  {Array.from({ length: 25 }, (_, index) => index + 1).map((lessonNumber) => (
                    <option key={lessonNumber} value={lessonNumber}>
                      {copy.lesson(lessonNumber, lessonCounts.counts.get(lessonNumber) ?? 0)}
                    </option>
                  ))}
                  <option value="extra">{copy.extraLesson(lessonCounts.extra)}</option>
                </select>
              </label>
            )}
            <label className="search-field">
              <span>{copy.search(locale === 'ja' ? heading.labelJa : heading.label)}</span>
              <span className="search-field__row">
                <input
                  type="search"
                  value={query}
                  placeholder={copy.placeholder}
                  onChange={(event) => {
                    setQuery(event.target.value)
                    updateViewState(event.target.value)
                  }}
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('')
                      updateViewState('')
                    }}
                  >
                    {copy.clear}
                  </button>
                )}
              </span>
            </label>
          </div>

          <p className="result-count" aria-live="polite">
            {copy.found(searchResults.length)}
          </p>

          {searchResults.length === 0 ? (
            <div className="study-empty">
              <p>{copy.empty}</p>
              <button
                type="button"
                onClick={() => {
                  setQuery('')
                  updateViewState('')
                }}
              >
                {copy.clearSearch}
              </button>
            </div>
          ) : (
            <ol className="study-list">
              {searchResults.slice(0, visibleCount).map((item) => (
                <li key={item.id} className="study-row">
                  <ItemSummary item={item} locale={locale} />
                  <div className="study-row__actions">
                    <a
                      className="study-details-link"
                      href={routeFor(category, item.id, query, lesson)}
                    >
                      {copy.details}
                    </a>
                  </div>
                </li>
              ))}
            </ol>
          )}

          {visibleCount < searchResults.length && (
            <button className="show-more" type="button" onClick={() => setVisibleCount((count) => count + 40)}>
              {copy.showMore}
            </button>
          )}
        </>
      )}

      <p className="dataset-note">
        {copy.dataset(manifest?.datasetVersion ?? '—')}{' '}
        <a href={`${import.meta.env.BASE_URL}data/n5/sources.json`}>{copy.sources}</a>
      </p>
    </section>
  )
}

function ItemSummary({ item, locale }: { item: StudyItem; locale: SiteLocale }) {
  if (isGrammarItem(item)) {
    return <div className="study-row__content"><strong lang="ja">{item.pattern}</strong><span lang="ru">{item.meaningRu}</span><small lang="ja">{item.examples[0]?.textJa}</small></div>
  }
  if (isVocabularyItem(item)) {
    return <div className="study-row__content"><strong lang="ja">{item.term}</strong><span lang="ja">{item.reading}</span><span lang="ru">{item.meaningsRu.join('; ')}</span><span className="study-row__lesson" lang={item.minnaLesson === null ? undefined : 'ja'}>{item.minnaLesson === null ? (locale === 'ru' ? 'Доп. N5' : 'N5追加') : `第${item.minnaLesson}課`}</span><small lang="ru">{item.partOfSpeech}</small></div>
  }
  return <div className="study-row__content study-row__content--kanji"><strong lang="ja">{item.character}</strong><span lang="ru">{item.meaningsRu.join('; ')}</span><small lang="ja">{[...item.readings.on, ...item.readings.kun].join(' · ')}</small></div>
}

function ItemDetail({ item, locale }: { item: StudyItem; locale: SiteLocale }) {
  const copy = catalogCopy[locale]
  if (isGrammarItem(item)) {
    return <><h3 lang="ja">{item.pattern}</h3><p className="detail-lead" lang="ru">{item.meaningRu}</p><p lang="ru">{item.explanationRu}</p>{item.examples.map((example) => <div className="example-note" key={example.textJa}><p lang="ja">{example.textJa}</p><p lang="ru">{example.translationRu}</p></div>)}</>
  }
  if (isVocabularyItem(item)) {
    return <><h3 lang="ja">{item.term}</h3><p className="detail-reading" lang="ja">{item.reading}</p><p className="detail-lead" lang="ru">{item.meaningsRu.join('; ')}</p><dl className="detail-facts"><div><dt>{copy.partOfSpeech}</dt><dd lang="ru">{item.partOfSpeech}</dd></div><div><dt>{copy.lessonFact}</dt><dd>{lessonName(item, locale, copy.extraFact)}</dd></div></dl></>
  }
  return <><h3 className="detail-kanji" lang="ja">{item.character}</h3><p className="detail-lead" lang="ru">{item.meaningsRu.join('; ')}</p><dl className="detail-facts"><div><dt>{copy.onyomi}</dt><dd lang="ja">{item.readings.on.join('、') || '—'}</dd></div><div><dt>{copy.kunyomi}</dt><dd lang="ja">{item.readings.kun.join('、') || '—'}</dd></div></dl><h4>{copy.wordExamples}</h4><ul className="kanji-examples">{item.examples.map((example) => <li key={`${example.term}-${example.reading}`}><span lang="ja">{example.term}</span><span lang="ja">{example.reading}</span><span lang="ru">{example.meaningRu}</span></li>)}</ul></>
}

function lessonName(item: VocabularyItem, locale: SiteLocale, extraLabel: string) {
  if (item.minnaLesson === null) return extraLabel
  return locale === 'ru' ? `Minna no Nihongo · урок ${item.minnaLesson}` : `みんなの日本語 · 第${item.minnaLesson}課`
}
