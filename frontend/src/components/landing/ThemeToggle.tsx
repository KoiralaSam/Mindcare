import { useTheme } from '../../theme/ThemeContext'
import { IconMoon, IconSun } from './LandingIcons'

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      className={`theme-toggle ${className ?? ''}`.trim()}
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-pressed={isDark}
    >
      <span className="theme-toggle__icon" aria-hidden>
        {isDark ? <IconSun /> : <IconMoon />}
      </span>
    </button>
  )
}
