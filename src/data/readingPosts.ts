import { parseTextPost, type TextPost } from './textPosts'

const readingModules = import.meta.glob('/content/readings/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

export const readingPosts: TextPost[] = Object.entries(readingModules)
  .map(([path, source]) => parseTextPost(source, path))
  .sort((a, b) => b.date.localeCompare(a.date))
