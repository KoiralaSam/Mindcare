import { Link, useLocation } from 'react-router-dom'
import { useAssessment } from '../assessment/useAssessment'

const HELPLINES = [
  {
    label: 'Nepal emergency',
    detail: 'Dial your local emergency number (e.g. 112 or 100) if you are in immediate danger.',
  },
  {
    label: 'Crisis lines',
    detail: 'Use a trusted national or local crisis hotline — add real numbers for your deployment region.',
  },
  {
    label: 'Someone you trust',
    detail: 'A family member, friend, teacher, or counselor can stay with you while you reach help.',
  },
] as const

export function SafetySupportPage() {
  const { stored } = useAssessment()
  const location = useLocation()
  const fromCheckInSafety =
    (location.state as { safetyCheckIn?: boolean } | null)?.safetyCheckIn === true

  const urgentIntro = stored?.safetyOverride === true || fromCheckInSafety

  return (
    <main className="shell shell--wide">
      <div className="safety-page">
        <header className="safety-page__header">
          <p className="eyebrow">Human support</p>
          <h1 className="title title--sm">You deserve support right now</h1>
          <p className="lede lede--compact">
            {urgentIntro ? (
              <>
                Your answers suggested this moment may be heavy in a way that needs people — not points, streaks, or
                lessons. NLN steps back from gamification here on purpose.
              </>
            ) : (
              <>
                Crisis and emotional safety resources are always here. This is not a substitute for emergency services or
                professional care — use what fits your situation.
              </>
            )}
          </p>
        </header>

        <section className="safety-page__panel" aria-labelledby="safety-actions-title">
          <h2 id="safety-actions-title" className="safety-page__panel-title">
            What can help
          </h2>
          <ul className="safety-page__list">
            {HELPLINES.map((item) => (
              <li key={item.label}>
                <strong>{item.label}.</strong> {item.detail}
              </li>
            ))}
          </ul>
        </section>

        <p className="safety-page__crisis">
          If you might act on thoughts of harming yourself, <strong>seek immediate help</strong> from emergency services or
          a crisis line — do not wait.
        </p>

        <div className="safety-page__actions">
          <Link to="/dashboard" className="btn btn--primary">
            Return to dashboard
          </Link>
          <a
            className="btn btn--ghost"
            href="https://www.who.int/publications/i/item/9789240003927"
            target="_blank"
            rel="noreferrer"
          >
            WHO stress resource (external)
          </a>
        </div>
      </div>
    </main>
  )
}
