export type PromptEntry = {
  id: string
  title: string
  description: string
  fileName: string
  tags: string[]
  addedAt?: string
}

export const prompts: PromptEntry[] = [
  {
    id: 'minna-no-nihongo-reading-text',
    title: 'Учебный текст по «みんなの日本語 初級 I»',
    description: 'Промпт для создания большого связного текста с ограничением по уроку, мини-словарём, разбором грамматики и вопросами.',
    fileName: 'prompt-minna-no-nihongo-reading-text.md',
    tags: ['японский', 'みんなの日本語', 'чтение', 'грамматика'],
  },
  {
    id: 'udobnaya-pdf-forma',
    title: 'Из скана или PDF в удобную заполняемую форму',
    description: 'Промпт для создания интерактивного PDF с оригиналом слева и просторными полями для ответов справа.',
    fileName: 'prompt-udobnaya-pdf-forma.md',
    tags: ['PDF', 'OCR', 'AcroForm', 'японский'],
  },
  {
    id: 'anki-minna-no-nihongo',
    title: 'Универсальный промпт для создания Anki-колод Minna no Nihongo',
    description: 'Промпт для создания единообразных Anki-колод с лексикой выбранного урока «みんなの日本語 初級 I / 初級 II».',
    fileName: 'prompt-anki-minna-no-nihongo.md',
    tags: ['Anki', 'みんなの日本語', 'лексика', 'карточки'],
    addedAt: '2026-09-23',
  },
]

export const normalizePromptSearch = (value: string) =>
  value.normalize('NFKC').toLocaleLowerCase().trim().replace(/\s+/gu, ' ')

export const filterPrompts = (items: PromptEntry[], query: string) => {
  const normalizedQuery = normalizePromptSearch(query)
  if (!normalizedQuery) return items

  return items.filter((item) =>
    normalizePromptSearch([item.title, item.description, ...item.tags].join(' '))
      .includes(normalizedQuery),
  )
}

const promptFileUrls = import.meta.glob('/content/prompts/*.md', {
  query: '?url',
  import: 'default',
  eager: true,
}) as Record<string, string>

export const getPromptFileUrl = (fileName: string) => {
  const url = promptFileUrls[`/content/prompts/${fileName}`]
  if (!url) throw new Error(`Не найден файл промпта: ${fileName}`)
  return url
}
