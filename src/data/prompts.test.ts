import { describe, expect, it } from 'vitest'
import { filterPrompts, getPromptCopyText, getPromptFileUrl, prompts } from './prompts'
import ankiSource from '../../content/prompts/prompt-anki-minna-no-nihongo.md?raw'
import pdfSource from '../../content/prompts/prompt-udobnaya-pdf-forma.md?raw'
import readingSource from '../../content/prompts/prompt-minna-no-nihongo-reading-text.md?raw'

describe('prompt clipboard text', () => {
  it('copies the Anki instructions without the document title and keeps internal headings', () => {
    const text = getPromptCopyText(ankiSource)
    expect(text.startsWith('Создай готовую отдельную Anki-колоду')).toBe(true)
    expect(text).not.toContain('# Универсальный промпт для создания Anki-колод')
    expect(text).toContain('## 1. Параметры')
    expect(text).toContain('# 16. Приоритет требований')
    expect(text.endsWith('LESSON_NUMBER={LESSON_NUMBER}')).toBe(true)
  })

  it('copies only the PDF prompt block without its description or usage notes', () => {
    const text = getPromptCopyText(pdfSource)
    expect(text.startsWith('**Задача:** распознай')).toBe(true)
    expect(text).toContain('**Главный критерий результата:**')
    expect(text).not.toMatch(/^>/m)
    expect(text).not.toContain('Универсальный промпт:')
    expect(text).not.toContain('Скопируй текст из блока ниже')
    expect(text).not.toContain('Промпт для копирования')
    expect(text).not.toContain('Дополнительные настройки')
    expect(text).not.toContain('**Совет:**')
    expect(getPromptCopyText(pdfSource.replace(/\n/g, '\r\n'))).toBe(text)
  })

  it('preserves a prompt that already contains only instructions', () => {
    expect(getPromptCopyText(readingSource)).toBe(readingSource.trim())
    expect(getPromptCopyText('')).toBe('')
  })
})

describe('prompt library search', () => {
  it('searches title, description and tags without case sensitivity', () => {
    expect(filterPrompts(prompts, 'pdf')).toHaveLength(1)
    expect(filterPrompts(prompts, 'интерактивного')).toHaveLength(1)
    expect(filterPrompts(prompts, 'ACROFORM')).toHaveLength(1)
  })

  it('returns all prompts for a blank query and none for a missing term', () => {
    expect(filterPrompts(prompts, '   ')).toEqual(prompts)
    expect(filterPrompts(prompts, 'несуществующий')).toEqual([])
  })

  it('finds the Minna no Nihongo reading prompt', () => {
    expect(filterPrompts(prompts, 'みんなの日本語').map((prompt) => prompt.id)).toEqual([
      'minna-no-nihongo-reading-text',
      'anki-minna-no-nihongo',
    ])
    expect(filterPrompts(prompts, 'чтение')).toHaveLength(1)
  })

  it('resolves every catalog entry to a bundled Markdown file', () => {
    for (const prompt of prompts) {
      expect(() => getPromptFileUrl(prompt.fileName)).not.toThrow()
      expect(getPromptFileUrl(prompt.fileName)).toContain('.md')
    }
  })

  it('rejects a catalog entry without a matching Markdown file', () => {
    expect(() => getPromptFileUrl('missing-prompt.md')).toThrow('Не найден файл промпта')
  })
})
