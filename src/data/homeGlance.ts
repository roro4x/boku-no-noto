import type { VocabularyItem } from './study'

export const MOSCOW_TIME_ZONE = 'Europe/Moscow'
export const TOKYO_TIME_ZONE = 'Asia/Tokyo'

export const splitMeaningParts = (meaning: string, limit = 4) => {
  const parts: string[] = []
  let current = ''
  let depth = 0

  for (const character of meaning) {
    if ('([{'.includes(character)) depth += 1
    if (')]}'.includes(character)) depth = Math.max(0, depth - 1)
    if (depth === 0 && (character === ',' || character === ';')) {
      if (current.trim()) parts.push(current.trim())
      current = ''
      continue
    }
    current += character
  }

  if (current.trim()) parts.push(current.trim())
  return parts.slice(0, limit)
}

export const summarizeMeaning = (meaning: string) => splitMeaningParts(meaning, 1)[0] ?? ''

const isReadableHomeWord = (item: VocabularyItem) => {
  const meaning = item.meaningsRu[0]?.trim() ?? ''
  const summary = summarizeMeaning(meaning)
  return Boolean(
    item.term.trim()
    && item.term.length <= 6
    && item.reading.trim()
    && summary
    && summary.length <= 80
    && !/^[:[(]/u.test(summary),
  )
}

export const pickRandomVocabulary = (
  items: VocabularyItem[],
  previousId: string | null,
  random = Math.random,
) => {
  const readableItems = items.filter(isReadableHomeWord)
  const freshItems = readableItems.filter((item) => item.id !== previousId)
  const pool = freshItems.length > 0 ? freshItems : readableItems
  if (pool.length === 0) return null
  const index = Math.min(Math.floor(random() * pool.length), pool.length - 1)
  return pool[index]
}

export const formatJapaneseDate = (date: Date) =>
  new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
    timeZone: MOSCOW_TIME_ZONE,
  }).format(date)

export const formatZonedTime = (date: Date, timeZone: string) =>
  new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone,
  }).format(date)
