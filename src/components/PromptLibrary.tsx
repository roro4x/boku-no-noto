import { useEffect, useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  filterPrompts,
  getPromptFileUrl,
  prompts,
  type PromptEntry,
} from '../data/prompts'
import type { SiteLocale } from '../i18n'

type PromptLibraryProps = {
  promptId?: string
  locale: SiteLocale
}

const promptCopy = {
  ru: {
    title: 'Библиотека промптов',
    intro: 'Личная файловая коллекция промптов для просмотра и скачивания.',
    search: 'Поиск по библиотеке',
    placeholder: 'Название, описание или тег',
    found: (count: number) => `Найдено: ${count}`,
    empty: 'По этому запросу промптов нет.',
    showAll: 'Показать всю библиотеку',
    read: 'Читать',
    download: 'Скачать .md',
    back: '← ко всем промптам',
    loading: 'Открываю исходный файл…',
    error: 'Не удалось прочитать исходный файл.',
    retry: 'Попробовать снова',
    notFound: 'Такого промпта нет в библиотеке.',
    tags: 'Теги',
  },
  ja: {
    title: 'プロンプト集',
    intro: '閲覧・ダウンロードできる個人用プロンプト集です。',
    search: 'プロンプトを検索',
    placeholder: 'タイトル・説明・タグ',
    found: (count: number) => `${count}件`,
    empty: 'この検索に一致するプロンプトはありません。',
    showAll: 'すべて表示',
    read: '読む',
    download: '.mdを保存',
    back: '← プロンプト一覧へ',
    loading: '元のファイルを開いています…',
    error: '元のファイルを読み込めませんでした。',
    retry: '再試行',
    notFound: 'このプロンプトは見つかりません。',
    tags: 'タグ',
  },
} as const

function PromptDownloadLink({ item, label }: { item: PromptEntry; label: string }) {
  return (
    <a className="prompt-download" href={getPromptFileUrl(item.fileName)} download={item.fileName}>
      <span className="file-icon" aria-hidden="true">MD</span>
      {label}
    </a>
  )
}

export function PromptLibrary({ promptId, locale }: PromptLibraryProps) {
  const copy = promptCopy[locale]
  const [query, setQuery] = useState('')
  const [content, setContent] = useState('')
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const item = promptId ? prompts.find((prompt) => prompt.id === decodeURIComponent(promptId)) : undefined
  const results = useMemo(() => filterPrompts(prompts, query), [query])

  useEffect(() => {
    if (!item) {
      setContent('')
      setLoadState('idle')
      return
    }

    const controller = new AbortController()
    setLoadState('loading')

    fetch(getPromptFileUrl(item.fileName), { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        return response.text()
      })
      .then((source) => {
        setContent(source)
        setLoadState('ready')
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setLoadState('error')
      })

    return () => controller.abort()
  }, [item])

  if (promptId && !item) {
    return (
      <section className="prompt-library" aria-labelledby="prompt-library-title">
        <LibraryHeading locale={locale} />
        <div className="archive-empty">
          <p>{copy.notFound}</p>
          <a href="#/prompts">{copy.showAll}</a>
        </div>
      </section>
    )
  }

  if (item) {
    return (
      <section className="prompt-library" aria-labelledby="prompt-title">
        <article className="prompt-document">
          <a className="back-link" href="#/prompts">{copy.back}</a>
          <header className="prompt-document__heading">
            <div>
              <h2 id="prompt-title" lang="ru">{item.title}</h2>
              <p lang="ru">{item.description}</p>
            </div>
            <PromptDownloadLink item={item} label={copy.download} />
          </header>
          <p className="prompt-tags" aria-label={copy.tags}>
            {item.tags.map((tag) => <span key={tag}>#{tag}</span>)}
          </p>

          {loadState === 'loading' && <div className="prompt-notice">{copy.loading}</div>}
          {loadState === 'error' && (
            <div className="prompt-notice prompt-notice--error" role="alert">
              <p>{copy.error}</p>
              <button type="button" onClick={() => window.location.reload()}>{copy.retry}</button>
            </div>
          )}
          {loadState === 'ready' && (
            <div className="markdown-body prompt-markdown" lang="ru">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ children }) => <h3 className="markdown-heading markdown-heading--2">{children}</h3>,
                  h2: ({ children }) => <h4 className="markdown-heading markdown-heading--3">{children}</h4>,
                  h3: ({ children }) => <h5 className="markdown-heading markdown-heading--4">{children}</h5>,
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          )}
        </article>
      </section>
    )
  }

  return (
    <section className="prompt-library" aria-labelledby="prompt-library-title">
      <LibraryHeading locale={locale} />
      <label className="prompt-search">
        <span>{copy.search}</span>
        <input
          type="search"
          value={query}
          placeholder={copy.placeholder}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      <p className="result-count" aria-live="polite">{copy.found(results.length)}</p>

      {results.length === 0 ? (
        <div className="archive-empty">
          <p>{copy.empty}</p>
          <button type="button" onClick={() => setQuery('')}>{copy.showAll}</button>
        </div>
      ) : (
        <ol className="prompt-list">
          {results.map((prompt) => (
            <li key={prompt.id}>
              <span className="file-icon" aria-hidden="true">MD</span>
              <div>
                <h3 lang="ru"><a href={`#/prompts/${prompt.id}`}>{prompt.title}</a></h3>
                <p lang="ru">{prompt.description}</p>
                <p className="prompt-tags" aria-label={copy.tags}>
                  {prompt.tags.map((tag) => <span key={tag}>#{tag}</span>)}
                </p>
              </div>
              <div className="prompt-list__actions">
                <a href={`#/prompts/${prompt.id}`}>{copy.read}</a>
                <PromptDownloadLink item={prompt} label={copy.download} />
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

function LibraryHeading({ locale }: { locale: SiteLocale }) {
  const copy = promptCopy[locale]
  return (
    <header className="archive-heading">
      <div>
        <h2 id="prompt-library-title">{copy.title}</h2>
        <p>{copy.intro}</p>
      </div>
      <span>{locale === 'ja' ? `${prompts.length}件` : `${prompts.length} файл`}</span>
    </header>
  )
}
