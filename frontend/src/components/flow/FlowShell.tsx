import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ThemeToggle } from '../landing/ThemeToggle'

type Props = {
  children: ReactNode
  title?: string
  backTo?: string
  backLabel?: string
}

export function FlowShell({ children, title = 'Mindcare', backTo = '/', backLabel = 'Home' }: Props) {
  return (
    <div className="flow-shell">
      <header className="flow-shell__top">
        <div className="flow-shell__bar">
          <Link to={backTo} className="flow-shell__back" aria-label={backLabel}>
            ←
          </Link>
          <p className="flow-shell__title">{title}</p>
          <ThemeToggle />
        </div>
      </header>
      <div className="flow-shell__body">{children}</div>
    </div>
  )
}
