import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { describe, expect, it } from 'vitest'
import { remarkStudyText, stripRubyAnnotations } from './remarkStudyText'

const render = (children: string) => renderToStaticMarkup(createElement(ReactMarkdown, {
  remarkPlugins: [remarkGfm, remarkStudyText], children,
}))

describe('study text Markdown', () => {
  it('renders explicit readings above words, retaining adjacent text and punctuation', () => {
    expect(render('{夢}(ゆめ)から{醒}(さ)めたら！')).toContain(
      '<ruby lang="ja">夢<rt>ゆめ</rt></ruby>から<ruby lang="ja">醒<rt>さ</rt></ruby>めたら！',
    )
    expect(stripRubyAnnotations('{夢}(ゆめ)から{醒}(さ)めたら！')).toBe('夢から醒めたら！')
  })

  it('keeps code literal and does not enable arbitrary HTML', () => {
    expect(render('`{夢}(ゆめ)`')).toContain('<code>{夢}(ゆめ)</code>')
    expect(render('<script>alert(1)</script>')).not.toContain('<script>')
    expect(render('{夢}(ゆめ')).not.toContain('<ruby')
  })

  it('gives parallel columns their language and preserves stanza breaks', () => {
    const html = render('| Оригинал | Перевод |\n| --- | --- |\n| {夢}(ゆめ) | Сон |\n| | |')
    expect(html).toContain('<table class="parallel-text">')
    expect(html).toContain('<th lang="ru" scope="col">Оригинал</th>')
    expect(html).toContain('<td lang="ja"><ruby')
    expect(html).toContain('<td lang="ru">Сон</td>')
    expect(html).toContain('class="parallel-text__break" aria-hidden="true"')
    expect(render('| A | B |\n| --- | --- |\n| 1 | 2 |')).not.toContain('parallel-text')
  })
})
