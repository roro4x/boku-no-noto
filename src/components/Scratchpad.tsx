import { useEffect, useRef, useState } from 'react'
import { copyText } from '../data/clipboard'
import { readScratchpad, saveScratchpad } from '../data/scratchpad'
import type { SiteLocale } from '../i18n'

const scratchCopy = {
  ru: {
    title: 'Черновик', close: 'Закрыть черновик', label: 'Текст черновика',
    copy: 'Копировать', copied: 'Скопировано',
    copyError: 'Не удалось скопировать. Выделите текст и скопируйте вручную.',
    clear: 'Очистить', undo: 'Восстановить',
    storageError: 'Браузер не разрешил сохранить текст. Скопируйте его перед закрытием страницы.',
  },
  ja: {
    title: '下書き', close: '下書きを閉じる', label: '下書きのテキスト',
    copy: 'コピー', copied: 'コピーしました',
    copyError: 'コピーできませんでした。テキストを選択して手動でコピーしてください。',
    clear: '消去', undo: '元に戻す',
    storageError: 'ブラウザーに保存できません。ページを閉じる前にコピーしてください。',
  },
} as const

export function Scratchpad({ locale }: { locale: SiteLocale }) {
  const copy = scratchCopy[locale]
  const [initial] = useState(() => {
    try { return { text: readScratchpad(window.localStorage), failed: false } }
    catch { return { text: '', failed: true } }
  })
  const [text, setText] = useState(initial.text)
  const [storageFailed, setStorageFailed] = useState(initial.failed)
  const [open, setOpen] = useState(false)
  const [undoText, setUndoText] = useState<string | null>(null)
  const [copyState, setCopyState] = useState<'idle' | 'success' | 'error'>('idle')
  const editor = useRef<HTMLTextAreaElement>(null)
  const toggle = useRef<HTMLButtonElement>(null)
  const error = storageFailed ? copy.storageError : copyState === 'error' ? copy.copyError : ''

  useEffect(() => {
    if (open) editor.current?.focus({ preventScroll: true })
  }, [open])

  useEffect(() => {
    if (copyState !== 'success') return
    const timer = window.setTimeout(() => setCopyState('idle'), 2500)
    return () => window.clearTimeout(timer)
  }, [copyState])

  const updateText = (next: string) => {
    setText(next)
    setCopyState('idle')
    try {
      saveScratchpad(window.localStorage, next)
      setStorageFailed(false)
    } catch { setStorageFailed(true) }
  }

  const close = () => {
    setOpen(false)
    toggle.current?.focus({ preventScroll: true })
  }

  return (
    <div className="scratchpad" onKeyDown={(event) => {
      if (open && event.key === 'Escape' && !event.nativeEvent.isComposing) {
        event.stopPropagation()
        close()
      }
    }}>
      {open && <section className="scratchpad__sheet" id="scratchpad-sheet" aria-labelledby="scratchpad-title">
        <header className="scratchpad__heading">
          <h2 id="scratchpad-title">{copy.title}</h2>
          <button type="button" onClick={close} aria-label={copy.close}>
            <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true"><path d="m5 5 10 10M15 5 5 15" /></svg>
          </button>
        </header>
        <div className="scratchpad__body">
          <label className="visually-hidden" htmlFor="scratchpad-text">{copy.label}</label>
          <textarea ref={editor} id="scratchpad-text" value={text}
            aria-describedby={error ? 'scratchpad-status' : undefined} spellCheck={false}
            onChange={(event) => { setUndoText(null); updateText(event.target.value) }} />
          <div className="scratchpad__actions">
            <button type="button" disabled={!text} onClick={async () => {
              try { await copyText(text); setCopyState('success') }
              catch { setCopyState('error') }
            }}>{copyState === 'success' ? copy.copied : copy.copy}</button>
            <button type="button" disabled={!text} onClick={() => {
              setUndoText(text)
              updateText('')
              editor.current?.focus()
            }}>{copy.clear}</button>
            {undoText !== null && <button type="button" onClick={() => {
              updateText(undoText)
              setUndoText(null)
              editor.current?.focus()
            }}>{copy.undo}</button>}
          </div>
          {error && <p className="scratchpad__status" id="scratchpad-status" role="status">{error}</p>}
        </div>
      </section>}
      <button ref={toggle} type="button" className="scratchpad__toggle" aria-expanded={open}
        aria-controls={open ? 'scratchpad-sheet' : undefined} onClick={() => open ? close() : setOpen(true)}>
        <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true">
          <path d="M12 3H3v14h14V8M8 12l1-4 6-6 3 3-6 6-4 1Z" />
        </svg>
        {copy.title}
      </button>
    </div>
  )
}
