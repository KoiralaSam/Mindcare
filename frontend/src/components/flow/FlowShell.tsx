import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ThemeToggle } from '../landing/ThemeToggle'

type Props = {
  children: ReactNode
  /** 0–1 for progress bar fill */
  progress?: number
  backTo?: string
  backLabel?: string
}

export function FlowShell({ children, progress = 0, backTo = '/', backLabel = 'Home' }: Props) {
  const pct = Math.min(100, Math.max(0, Math.round(progress * 100)))
  return (
    <div className="flow-shell">
      <header className="flow-shell__top">
        <div className="flow-shell__bar">
          <Link to={backTo} className="flow-shell__back" aria-label={backLabel}>
            ←
          </Link>
          <div className="flow-shell__progress-track" aria-hidden>
            <div className="flow-shell__progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <ThemeToggle />
        </div>
      </header>
      <div className="flow-shell__body">{children}</div>
    </div>
  )
}
