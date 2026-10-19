// Shared by the prompt library, local scratchpad, and site banner.
export const copyText = async (text: string) => {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return
    } catch {
      // Older and restricted browsers can still support an explicit copy action.
    }
  }

  const previousFocus = document.activeElement
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.readOnly = true
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.append(textarea)
  try {
    textarea.select()
    if (!document.execCommand('copy')) throw new Error('Copy was rejected')
  } finally {
    textarea.remove()
    if (previousFocus instanceof HTMLElement) previousFocus.focus({ preventScroll: true })
  }
}
