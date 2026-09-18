import { useEffect, useMemo, useState } from 'react'
import {
  categories,
  isGrammarItem,
  isVocabularyItem,
  searchStudyItems,
  type StudyCategory,
  type StudyItem,
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
  },
} as const

const categoryFile: Record<StudyCategory, string> = {
  grammar: 'grammar.json',
  vocabulary: 'vocabulary.json',
  kanji: 'kanji.json',
}

const categoryHeading = (category: StudyCategory) =>
  categories.find((item) => item.id === category) ?? categories[0]

const routeFor = (category: StudyCategory, itemId?: string, query = '') => {
  const params = new URLSearchParams()
  if (query) params.set('q', query)
  const suffix = params.size ? `?${params.toString()}` : ''
  return `#/nihongo/${category}${itemId ? `/${encodeURIComponent(itemId)}` : ''}${suffix}`
}

export function NihongoCatalog({ category, itemId, locale }: NihongoCatalogProps) {
  const params = new URLSearchParams(window.location.hash.split('?')[1] ?? '')
  const [query, setQuery] = useState(params.get('q') ?? '')
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
  }, [category, itemId])

  useEffect(() => {
    setVisibleCount(40)
  }, [category, query])

  const searchResults = useMemo(() => searchStudyItems(items, query), [items, query])
  const detailItem = itemId ? items.find((item) => item.id === decodeURIComponent(itemId)) : undefined

  const updateViewState = (nextQuery: string) => {
    window.history.replaceState(null, '', routeFor(category, undefined, nextQuery))
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
          <a className="back-link" href={routeFor(category, undefined, query)}>{copy.back}</a>
          <ItemDetail item={detailItem} locale={locale} />
        </article>
      ) : (
        <>
          <div className="study-tools">
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
                  <ItemSummary item={item} />
                  <div className="study-row__actions">
                    <a href={routeFor(category, item.id, query)}>{copy.details}</a>
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

function ItemSummary({ item }: { item: StudyItem }) {
  if (isGrammarItem(item)) {
    return <div className="study-row__content"><strong lang="ja">{item.pattern}</strong><span lang="ru">{item.meaningRu}</span><small lang="ja">{item.examples[0]?.textJa}</small></div>
  }
  if (isVocabularyItem(item)) {
    return <div className="study-row__content"><strong lang="ja">{item.term}</strong><span lang="ja">{item.reading}</span><span lang="ru">{item.meaningsRu.join('; ')}</span><small lang="ru">{item.partOfSpeech}</small></div>
  }
  return <div className="study-row__content study-row__content--kanji"><strong lang="ja">{item.character}</strong><span lang="ru">{item.meaningsRu.join('; ')}</span><small lang="ja">{[...item.readings.on, ...item.readings.kun].join(' · ')}</small></div>
}

function ItemDetail({ item, locale }: { item: StudyItem; locale: SiteLocale }) {
  const copy = catalogCopy[locale]
  if (isGrammarItem(item)) {
    return <><h3 lang="ja">{item.pattern}</h3><p className="detail-lead" lang="ru">{item.meaningRu}</p><p lang="ru">{item.explanationRu}</p>{item.examples.map((example) => <div className="example-note" key={example.textJa}><p lang="ja">{example.textJa}</p><p lang="ru">{example.translationRu}</p></div>)}</>
  }
  if (isVocabularyItem(item)) {
    return <><h3 lang="ja">{item.term}</h3><p className="detail-reading" lang="ja">{item.reading}</p><p className="detail-lead" lang="ru">{item.meaningsRu.join('; ')}</p><dl className="detail-facts"><div><dt>{copy.partOfSpeech}</dt><dd lang="ru">{item.partOfSpeech}</dd></div></dl></>
  }
  return <><h3 className="detail-kanji" lang="ja">{item.character}</h3><p className="detail-lead" lang="ru">{item.meaningsRu.join('; ')}</p><dl className="detail-facts"><div><dt>{copy.onyomi}</dt><dd lang="ja">{item.readings.on.join('、') || '—'}</dd></div><div><dt>{copy.kunyomi}</dt><dd lang="ja">{item.readings.kun.join('、') || '—'}</dd></div></dl><h4>{copy.wordExamples}</h4><ul className="kanji-examples">{item.examples.map((example) => <li key={`${example.term}-${example.reading}`}><span lang="ja">{example.term}</span><span lang="ja">{example.reading}</span><span lang="ru">{example.meaningRu}</span></li>)}</ul></>
}
