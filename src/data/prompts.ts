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
