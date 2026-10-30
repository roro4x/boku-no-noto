type MarkdownNode = {
  type: string
  value?: string
  children?: MarkdownNode[]
  data?: { hName?: string; hProperties?: Record<string, string | boolean> }
}

// Explicit readings, e.g. {夢}(ゆめ), keep the source editable without enabling HTML.
const rubyPattern = /\{([^{}\n]+)\}\(([^()\n]+)\)/gu

export const stripRubyAnnotations = (text: string) =>
  text.replace(rubyPattern, '$1')

export function remarkStudyText() {
  return (tree: MarkdownNode) => {
    const visit = (node: MarkdownNode) => {
      if (!node.children) return

      if (node.type === 'table') {
        // Only bilingual tables with explicit readings receive the study layout.
        const hasRuby = (item: MarkdownNode): boolean =>
          (item.type === 'text' && /\{[^{}\n]+\}\([^()\n]+\)/u.test(item.value ?? '')) ||
          (item.children?.some(hasRuby) ?? false)
        if (hasRuby(node) && node.children.every((row) => row.children?.length === 2)) {
          node.data = { hProperties: { className: 'parallel-text' } }
          for (const [rowIndex, row] of node.children.entries()) {
            if (row.children?.every((cell) => cell.children?.length === 0)) {
              row.data = { hProperties: { className: 'parallel-text__break', 'aria-hidden': true } }
            }
            row.children?.forEach((cell, index) => {
              cell.data = { hProperties: {
                lang: rowIndex === 0 ? 'ru' : index === 0 ? 'ja' : 'ru',
                ...(rowIndex === 0 ? { scope: 'col' } : {}),
              } }
            })
          }
        }
      }

      node.children = node.children.flatMap((child) => {
        if (child.type !== 'text' || !child.value) {
          visit(child)
          return [child]
        }

        const result: MarkdownNode[] = []
        let cursor = 0
        for (const match of child.value.matchAll(rubyPattern)) {
          const index = match.index!
          if (index > cursor) result.push({ type: 'text', value: child.value.slice(cursor, index) })
          result.push({
            type: 'ruby',
            data: { hName: 'ruby', hProperties: { lang: 'ja' } },
            children: [
              { type: 'text', value: match[1] },
              { type: 'rubyReading', data: { hName: 'rt' }, children: [{ type: 'text', value: match[2] }] },
            ],
          })
          cursor = index + match[0].length
        }
        if (cursor === 0) return [child]
        if (cursor < child.value.length) result.push({ type: 'text', value: child.value.slice(cursor) })
        return result
      })
    }
    visit(tree)
  }
}
