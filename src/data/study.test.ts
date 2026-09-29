import { describe, expect, it } from 'vitest'
import {
  filterVocabularyByLesson,
  normalizeSearch,
  searchStudyItems,
  type GrammarItem,
  type VocabularyItem,
} from './study'

const grammar: GrammarItem = {
  id: 'grammar:n5-001',
  pattern: '〜てもいいです',
  meaningRu: 'можно делать',
  explanationRu: 'Разрешение.',
  examples: [{ textJa: 'ここに座ってもいいです。', translationRu: 'Здесь можно сидеть.' }],
  sourceRefs: ['openjlpt'],
  order: 1,
}

const vocabulary: VocabularyItem = {
  id: 'vocab:test',
  term: '学校',
  reading: 'がっこう',
  meaningsRu: ['школа'],
  partOfSpeech: 'существительное',
  sourceRefs: ['openjlpt'],
  order: 2,
  minnaLesson: 1,
  minnaOrder: 4,
}

const extraVocabulary: VocabularyItem = {
  ...vocabulary,
  id: 'vocab:extra',
  term: '余分',
  reading: 'よぶん',
  minnaLesson: null,
  minnaOrder: null,
}

describe('normalizeSearch', () => {
  it('normalizes width, case and extra spaces', () => {
    expect(normalizeSearch('  ＧＡＫＫＯＵ  ')).toBe('gakkou')
    expect(normalizeSearch('  ШКОЛА  ')).toBe('школа')
  })
})

describe('searchStudyItems', () => {
  it('searches Russian, Japanese writing and reading', () => {
    const items = [grammar, vocabulary]
    expect(searchStudyItems(items, 'школа')).toEqual([vocabulary])
    expect(searchStudyItems(items, '学校')).toEqual([vocabulary])
    expect(searchStudyItems(items, 'がっこう')).toEqual([vocabulary])
    expect(searchStudyItems(items, 'ても')).toEqual([grammar])
    expect(searchStudyItems(items, 'несуществующий запрос')).toEqual([])
  })
})

describe('filterVocabularyByLesson', () => {
  it('separates Minna no Nihongo lessons from additional N5 words', () => {
    const items = [extraVocabulary, vocabulary]
    expect(filterVocabularyByLesson(items, 1)).toEqual([vocabulary])
    expect(filterVocabularyByLesson(items, 'extra')).toEqual([extraVocabulary])
    expect(filterVocabularyByLesson(items, 'all')).toEqual(items)
  })
})
