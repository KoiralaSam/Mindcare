import type { CSSProperties } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { coreFromStored } from '../assessment/storage'
import { useAssessment } from '../assessment/useAssessment'
import { zoneById } from '../assessment/zones'

export function CheckInResultPage() {
  const { stored } = useAssessment()

  if (!stored) {
    return <Navigate to="/dashboard/check-in" replace />
  }
  if (stored.safetyOverride) {
    return <Navigate to="/dashboard/safety" replace />
  }

  const core = coreFromStored(stored)
  if (!core) {
    return <Navigate to="/dashboard/check-in" replace />
  }

  const zone = zoneById(stored.zoneId)
  const zoneStyle = { '--zone': zone.tone } as CSSProperties

  return (
    <main className="shell shell--wide">
      <div className="checkin-result">
        <header className="checkin-result__header">
          <p className="eyebrow">Check-in complete</p>
          <h1 className="title title--sm">Where you stand right now</h1>
          <p className="lede lede--compact">
            This is a <strong>self-check</strong>, not a diagnosis. The score helps suggest support that fits how heavy things feel.
          </p>
        </header>

        <article className="checkin-result__card" style={zoneStyle}>
          <p className="checkin-result__meta">
            {zone.name} · product score {stored.totalRisk} / 48
          </p>
          <h2 className="checkin-result__label">{zone.label}</h2>
          <p className="checkin-result__copy">{zone.copy}</p>
        </article>

        <p className="checkin-result__note">
          Bands describe how heavy things feel — not clinical categories. If anything changes or feels urgent, talk to someone you trust or a professional.
        </p>

        <div className="checkin-result__actions">
          <Link to="/dashboard" className="btn btn--primary">
            Back to dashboard
          </Link>
          <Link to="/dashboard/check-in" className="btn btn--ghost">
            Retake check-in
          </Link>
        </div>
      </div>
    </main>
  )
}
