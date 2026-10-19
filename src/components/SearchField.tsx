import { useRef } from 'react'

type SearchFieldProps = {
  label: string
  placeholder: string
  value: string
  clearLabel: string
  onChange: (value: string) => void
}

export function SearchField({ label, placeholder, value, clearLabel, onChange }: SearchFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <div className="archive-search-field">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m15.5 15.5 5 5" />
      </svg>
      <input ref={inputRef} type="search" aria-label={label} placeholder={placeholder}
        value={value} onChange={(event) => onChange(event.target.value)} />
      {value && <button type="button" aria-label={clearLabel} onClick={() => {
        onChange('')
        inputRef.current?.focus()
      }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <path d="m6 6 12 12M18 6 6 18" />
        </svg>
      </button>}
    </div>
  )
}
