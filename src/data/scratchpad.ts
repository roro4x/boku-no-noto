export const scratchpadKey = 'boku-no-noto-scratchpad'

type LocalStore = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

export const readScratchpad = (storage: Pick<LocalStore, 'getItem'>) =>
  storage.getItem(scratchpadKey) ?? ''

export const saveScratchpad = (storage: Pick<LocalStore, 'setItem' | 'removeItem'>, text: string) => {
  if (text) storage.setItem(scratchpadKey, text)
  else storage.removeItem(scratchpadKey)
}
