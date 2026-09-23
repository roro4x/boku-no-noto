import { describe, expect, it } from 'vitest'
import { filterPrompts, getPromptFileUrl, prompts } from './prompts'

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
