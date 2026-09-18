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

export const getPromptFileUrl = (fileName: string) =>
  `${import.meta.env.BASE_URL}prompts/${encodeURIComponent(fileName)}`
