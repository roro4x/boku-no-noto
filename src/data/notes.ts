import { parseTextPost, type TextPost } from './textPosts'

export type Note = TextPost

const noteModules = import.meta.glob('/content/notes/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

export const notes: Note[] = Object.entries(noteModules)
  .map(([path, source]) => parseTextPost(source, path))
  .sort((a, b) => b.date.localeCompare(a.date))

export const searchNotes = (items: Note[], query: string) => {
  const normalize = (value: string) =>
    value.normalize('NFKC').toLocaleLowerCase('ru').trim().replace(/\s+/gu, ' ')
  const search = normalize(query)
  return items.filter((note) => normalize(
    [note.title, note.description, note.content].join(' '),
  ).includes(search))
}
