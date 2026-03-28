import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { DashboardLayout } from '../components/dashboard/DashboardLayout'
import { useAssessment } from '../assessment/useAssessment'
import { useWellnessFrontendResult } from '../assessment/useWellnessFrontendResult'
import { formatAgeGroupLabel } from '../utils/formatWellnessResult'

function zoneDotModifier(zone: string): string {
  const z = zone.toLowerCase()
  if (z.includes('red')) return 'dash-summary__dot--red'
  if (z.includes('orange')) return 'dash-summary__dot--orange'
  if (z.includes('yellow')) return 'dash-summary__dot--yellow'
  if (z.includes('green')) return 'dash-summary__dot--green'
  return 'dash-summary__dot--blue'
}

function zoneLineModifier(zone: string): string {
  const z = zone.toLowerCase()
  if (z.includes('red')) return 'dash-summary__zone-line--red'
  if (z.includes('orange')) return 'dash-summary__zone-line--orange'
  if (z.includes('yellow')) return 'dash-summary__zone-line--yellow'
  if (z.includes('green')) return 'dash-summary__zone-line--green'
  return 'dash-summary__zone-line--blue'
}

export function WellnessSummaryPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const frontend = useWellnessFrontendResult()
  const { stored } = useAssessment()
  const { wellnessCompleted, completeWellness } = useAuth()
  const nextPath = (location.state as { next?: string } | null)?.next ?? '/dashboard'

  useEffect(() => {
    if (frontend) return
    if (wellnessCompleted) {
      navigate('/dashboard', { replace: true })
      return
    }
    navigate('/login', { replace: true })
  }, [frontend, navigate, wellnessCompleted])

  if (!frontend) {
    return (
      <DashboardLayout>
        <main className="dash-app__main">
          <div className="dash-app__main-inner">
            <p className="dash-app__empty-text">Loading your result…</p>
          </div>
        </main>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <main className="dash-app__main">
        <div className="dash-app__main-inner">
          <section className="dash-summary" aria-labelledby="wellness-summary-heading">
            <div className={`dash-summary__dot ${zoneDotModifier(frontend.zone)}`} aria-hidden />
            <p className="dash-summary__eyebrow">Your zone</p>
            <h1 id="wellness-summary-heading" className="dash-summary__title">
              {frontend.title}
            </h1>
            <p className={`dash-summary__zone-line ${zoneLineModifier(frontend.zone)}`}>{frontend.zone}</p>

            <dl className="dash-summary__facts">
              <div className="dash-summary__fact">
                <dt className="dash-summary__fact-label">Age group</dt>
                <dd className="dash-summary__fact-value">{formatAgeGroupLabel(frontend.age_group)}</dd>
              </div>
              <div className="dash-summary__fact">
                <dt className="dash-summary__fact-label">Gender</dt>
                <dd className="dash-summary__fact-value">{frontend.gender}</dd>
              </div>
            </dl>

            <div className="dash-summary__box">
              <p className="dash-summary__text">{frontend.description}</p>
            </div>

            {stored ? (
              <p className="dash-summary__meta">
                Check-in score {stored.totalRisk}/48
                {stored.safetyOverride ? ' · if you are in crisis, reach out for support right away.' : ''}
              </p>
            ) : null}

            <div className="wellness-summary__actions">
              <button
                type="button"
                className="wellness-summary__cta"
                onClick={() => {
                  completeWellness()
                  navigate(nextPath, { replace: true })
                }}
              >
                Continue to today&apos;s tasks
              </button>
            </div>

            <p className="dash-app__disclaimer dash-app__disclaimer--solo">
              Self-check only — not a diagnosis. If you are in crisis, use local emergency or crisis lines.
            </p>
          </section>
        </div>
      </main>
    </DashboardLayout>
  )
}
