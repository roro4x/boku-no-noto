export type VocabularyItem = {
  id: string
  order: number
  term: string
  reading: string
  meaningsRu: string[]
  sentence: string
  sentenceMeaningRu: string
  notesRu: string
}

export const normalizeSearch = (value: string) =>
  value.normalize('NFKC').toLocaleLowerCase('ru').trim().replace(/\s+/gu, ' ')

export const searchVocabulary = (items: VocabularyItem[], query: string) => {
  const search = normalizeSearch(query)
  return items.filter((item) => normalizeSearch(
    [item.term, item.reading, ...item.meaningsRu].join(' '),
  ).includes(search))
}

export const loadVocabulary = async (signal?: AbortSignal): Promise<VocabularyItem[]> => {
  const response = await fetch(`${import.meta.env.BASE_URL}data/kaishi/vocabulary.json`, { signal })
  if (!response.ok) throw new Error('Cannot load Kaishi vocabulary')
  return response.json()
}
