const STORAGE = 'nln-theme'

export function ThemeToggle() {
  function toggle() {
    const el = document.documentElement
    const next = el.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'
    el.setAttribute('data-theme', next)
    try {
      localStorage.setItem(STORAGE, next)
    } catch {
      /* ignore */
    }
  }

  const isDark = typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark'

  return (
    <button type="button" className="theme-toggle" onClick={toggle} aria-label="Toggle color theme">
      <span className="theme-toggle__icon" aria-hidden>
        {isDark ? '☀' : '☾'}
      </span>
    </button>
  )
}
