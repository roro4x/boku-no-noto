import { SearchField } from './SearchField'
import { useEffect, useMemo, useState } from 'react'
import { loadVocabulary, searchVocabulary, type VocabularyItem } from '../data/vocabulary'
import type { SiteLocale } from '../i18n'

const catalogCopy = {
  ru: {
    title: 'Словарь', loading: 'Открываю колоду…',
    error: 'Не удалось загрузить слова. Попробуйте ещё раз.', retry: 'Повторить',
    search: 'Поиск по слову, чтению или переводу', placeholder: '日本語, чтение или перевод',
    clear: 'Очистить', found: (count: number) => `Найдено: ${count}`, more: 'Показать ещё 40',
    empty: 'По этому запросу слов нет.', details: 'Подробнее', back: '← Назад',
    missing: 'Такое слово не найдено.', example: 'Пример из колоды', notes: 'Примечание',
    source: 'Слова, русские переводы и примеры из колоды Kaishi 1.5k Russian.',
  },
  ja: {
    title: '辞書', loading: 'デッキを開いています…',
    error: '単語を読み込めませんでした。もう一度お試しください。', retry: '再試行',
    search: '単語・読み方・ロシア語訳を検索', placeholder: '日本語・読み方・ロシア語訳',
    clear: 'クリア', found: (count: number) => `${count}件`, more: '次の40件を表示',
    empty: '条件に合う単語はありません。', details: '詳しく見る', back: '← 戻る',
    missing: 'この単語は見つかりません。', example: 'デッキの例文', notes: '補足',
    source: 'Kaishi 1.5k Russianの単語・ロシア語訳・例文です。',
  },
} as const

const routeFor = (id?: string, query = '') =>
  `#/words${id ? `/${encodeURIComponent(id)}` : ''}${query ? `?${new URLSearchParams({ q: query })}` : ''}`

const expandedCounts = new Map<string, number>()

export function VocabularyCatalog({ itemId, locale }: { itemId?: string; locale: SiteLocale }) {
  const [query, setQuery] = useState(() => new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('q') ?? '')
  const [items, setItems] = useState<VocabularyItem[]>([])
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [attempt, setAttempt] = useState(0)
  const [visibleCount, setVisibleCount] = useState(() => expandedCounts.get(query) ?? 40)
  const copy = catalogCopy[locale]
  useEffect(() => {
    const restoreQuery = () => {
      const restoredQuery = new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('q') ?? ''
      setQuery(restoredQuery)
      setVisibleCount(expandedCounts.get(restoredQuery) ?? 40)
    }
    window.addEventListener('hashchange', restoreQuery)
    return () => window.removeEventListener('hashchange', restoreQuery)
  }, [])
  useEffect(() => {
    const controller = new AbortController()
    setState('loading')
    loadVocabulary(controller.signal).then((words) => {
      if (controller.signal.aborted) return
      setItems(words)
      setState('ready')
    }).catch(() => {
      if (!controller.signal.aborted) setState('error')
    })
    return () => controller.abort()
  }, [attempt])

  const results = useMemo(() => searchVocabulary(items, query), [items, query])
  const selected = items.find((item) => item.id === itemId)
  const updateQuery = (value: string) => {
    setQuery(value)
    setVisibleCount(40)
    window.history.replaceState(null, '', routeFor(undefined, value))
  }

  useEffect(() => { expandedCounts.set(query, visibleCount) }, [query, visibleCount])

  return (
    <section className="catalog-shell" aria-labelledby="catalog-title">
      <header className="catalog-heading"><h2 id="catalog-title">{copy.title}</h2></header>
      {state === 'loading' ? <p className="catalog-loading" role="status">{copy.loading}</p>
        : state === 'error' ? <div className="catalog-error" role="alert"><p>{copy.error}</p><button onClick={() => setAttempt((n) => n + 1)}>{copy.retry}</button></div>
        : itemId ? (
          <article className="study-detail">
            <a className="back-link utility-link" href={routeFor(undefined, query)}>{copy.back}</a>
            {selected ? <>
              <h3 lang="ja">{selected.term}</h3>
              <p className="detail-reading" lang="ja">{selected.reading}</p>
              <p className="detail-lead" lang="ru">{selected.meaningsRu.join('; ')}</p>
              {selected.sentence && <><h4>{copy.example}</h4><div className="example-note"><p lang="ja">{selected.sentence}</p><p lang="ru">{selected.sentenceMeaningRu}</p></div></>}
              {selected.notesRu && <><h4>{copy.notes}</h4><p lang="ru" className="vocabulary-notes">{selected.notesRu}</p></>}
            </> : <p>{copy.missing}</p>}
          </article>
        ) : <>
          <SearchField label={copy.search} placeholder={copy.placeholder} value={query}
            clearLabel={copy.clear} onChange={updateQuery} />
          <p className="result-count" aria-live="polite">{copy.found(results.length)}</p>
          {results.length ? <ol className="study-list">
            {results.slice(0, visibleCount).map((item) => <li className="study-row" key={item.id}>
              <div className="study-row__content"><strong lang="ja">{item.term}</strong><span lang="ja">{item.reading}</span><span lang="ru">{item.meaningsRu.join('; ')}</span></div>
              <div className="study-row__actions"><a className="study-details-link" href={routeFor(item.id, query)} aria-label={`${copy.details}: ${item.term}`}>{copy.details}</a></div>
            </li>)}
          </ol> : <div className="study-empty"><p>{copy.empty}</p><button onClick={() => updateQuery('')}>{copy.clear}</button></div>}
          {visibleCount < results.length && <button className="show-more" onClick={() => setVisibleCount((n) => n + 40)}>{copy.more}</button>}
        </>}
      <p className="dataset-note">{copy.source}</p>
    </section>
  )
}
