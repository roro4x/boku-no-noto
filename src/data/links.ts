export type SiteLink = {
  id: string
  title: string
  url: string
  banner: string
  description?: string
}

export const siteLinks: SiteLink[] = [
  {
    id: 'fast-tool',
    title: 'Fast Tool',
    url: 'https://fast-tool.ru/',
    banner: 'assets/banners/fast-tool.svg',
  },
]
