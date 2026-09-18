export type StudyCategory = 'grammar' | 'vocabulary' | 'kanji'

export type GrammarItem = {
  id: string
  pattern: string
  meaningRu: string
  explanationRu: string
  examples: Array<{ textJa: string; reading?: string; translationRu: string }>
  sourceRefs: string[]
  order: number
  tags?: string[]
}

export type VocabularyItem = {
  id: string
  term: string
  reading: string
  meaningsRu: string[]
  partOfSpeech: string
  sourceRefs: string[]
  order: number
}

export type KanjiItem = {
  id: string
  character: string
  meaningsRu: string[]
  readings: { on: string[]; kun: string[] }
  examples: Array<{ term: string; reading: string; meaningRu: string }>
  sourceRefs: string[]
  order: number
}

export type StudyItem = GrammarItem | VocabularyItem | KanjiItem

export const categories: Array<{ id: StudyCategory; label: string; labelJa: string }> = [
  { id: 'grammar', label: 'Грамматика', labelJa: '文法' },
  { id: 'vocabulary', label: 'Слова', labelJa: '語彙' },
  { id: 'kanji', label: 'Кандзи', labelJa: '漢字' },
]

export const normalizeSearch = (value: string) =>
  value.normalize('NFKC').toLocaleLowerCase('ru').trim().replace(/\s+/gu, ' ')

export const isGrammarItem = (item: StudyItem): item is GrammarItem => 'pattern' in item
export const isVocabularyItem = (item: StudyItem): item is VocabularyItem => 'term' in item
export const isKanjiItem = (item: StudyItem): item is KanjiItem => 'character' in item

export const itemSearchText = (item: StudyItem) => {
  if (isGrammarItem(item)) {
    return [item.pattern, item.meaningRu, item.explanationRu, ...item.tags ?? []].join(' ')
  }
  if (isVocabularyItem(item)) {
    return [item.term, item.reading, ...item.meaningsRu, item.partOfSpeech].join(' ')
  }
  return [
    item.character,
    ...item.meaningsRu,
    ...item.readings.on,
    ...item.readings.kun,
    ...item.examples.flatMap((example) => [example.term, example.reading, example.meaningRu]),
  ].join(' ')
}

export const searchStudyItems = (items: StudyItem[], query: string) => {
  const normalizedQuery = normalizeSearch(query)
  return items.filter(
    (item) =>
      normalizedQuery.length === 0 || normalizeSearch(itemSearchText(item)).includes(normalizedQuery),
  )
}
