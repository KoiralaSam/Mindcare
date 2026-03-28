import { useCallback, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CORE_QUESTIONS, SAFETY_QUESTION, SECTION_LABELS } from '../assessment/questions'
import {
  coreAnswersFromFlat,
  safetyOverrideFromQ13,
  shouldShowQ13,
  totalRisk,
  zoneFromCore,
  type SafetyAnswer,
} from '../assessment/scoring'
import { buildStoredAssessment } from '../assessment/storage'
import { useAssessment } from '../assessment/useAssessment'

export function QuickCheckInPage() {
  const navigate = useNavigate()
  const { email, save } = useAssessment()
  const [step, setStep] = useState(0)
  /** 12 core answers; null = not yet answered */
  const [coreFlat, setCoreFlat] = useState<(number | null)[]>(() => Array(12).fill(null))
  const [q13, setQ13] = useState<SafetyAnswer | undefined>(undefined)

  const allCoreAnswered = coreFlat.every((x) => x !== null)
  const coreForGate = allCoreAnswered ? coreAnswersFromFlat(coreFlat as number[]) : null
  const needQ13 = coreForGate ? shouldShowQ13(coreForGate) : false
  const totalSteps = needQ13 ? 13 : 12

  const currentQuestion = step < 12 ? CORE_QUESTIONS[step] : null
  const showQ13Step = step === 12

  const progressNumerator = Math.min(step + 1, totalSteps)
  const progress = totalSteps > 0 ? (progressNumerator / totalSteps) * 100 : 0

  const blockIntro = currentQuestion
    ? SECTION_LABELS[currentQuestion.block]
    : showQ13Step
      ? { title: 'Safety (when needed)', hint: 'One extra question. Skip if you prefer.' }
      : null

  const canGoNext = step < 12 ? coreFlat[step] !== null : showQ13Step && q13 !== undefined

  const finalize = useCallback(() => {
    const nums = coreFlat.map((x) => x ?? 0)
    const core = coreAnswersFromFlat(nums)
    if (!core || !email) return

    const risk = totalRisk(core)
    const zoneId = zoneFromCore(core)
    const q13Val: SafetyAnswer = showQ13Step ? (q13 ?? null) : null
    const q13Addressed = showQ13Step ? q13 !== undefined : true
    const override = showQ13Step && safetyOverrideFromQ13(q13Val)

    const payload = buildStoredAssessment(core, q13Val, q13Addressed, risk, zoneId, override)
    save(payload)

    if (override) {
      navigate('/dashboard/safety', { replace: true, state: { safetyCheckIn: true } })
      return
    }
    navigate('/dashboard/check-in/result', { replace: true })
  }, [coreFlat, email, navigate, q13, save, showQ13Step])

  const goNext = useCallback(() => {
    if (step < 11) {
      setStep((s) => s + 1)
      return
    }
    if (step === 11) {
      const nums = coreFlat.map((x) => x ?? 0)
      const core = coreAnswersFromFlat(nums)
      if (!core) return
      if (shouldShowQ13(core)) {
        setStep(12)
        setQ13(undefined)
      } else {
        const risk = totalRisk(core)
        const zoneId = zoneFromCore(core)
        if (!email) return
        save(buildStoredAssessment(core, null, true, risk, zoneId, false))
        navigate('/dashboard/check-in/result', { replace: true })
      }
    }
  }, [coreFlat, email, navigate, save, step])

  const goBack = useCallback(() => {
    if (step > 0) setStep((s) => s - 1)
  }, [step])

  const labelStep11 =
    !allCoreAnswered || !coreForGate
      ? 'Next'
      : shouldShowQ13(coreForGate)
        ? 'Continue'
        : 'See results'

  const selectOption = (value: number) => {
    if (step < 12) {
      setCoreFlat((prev) => {
        const next = [...prev]
        next[step] = value
        return next
      })
    }
  }

  const handleQ13Select = (value: number) => {
    setQ13(value)
  }

  const handleSkipQ13 = () => {
    setQ13(null)
  }

  const submitQ13 = () => {
    if (q13 === undefined) return
    finalize()
  }

  if (!email) {
    return (
      <main className="shell shell--wide">
        <p className="checkin__error">Sign in to continue.</p>
      </main>
    )
  }

  return (
    <main className="shell shell--wide">
      <div className="checkin">
        <header className="checkin__header">
          <Link to="/dashboard" className="checkin__back">
            ← Dashboard
          </Link>
          <p className="eyebrow">Quick check-in</p>
          <h1 className="title title--sm">Project NLN</h1>
          <p className="lede lede--compact">
            About two minutes. Your answers stay on this device until you connect a real account API.
          </p>
        </header>

        <div
          className="checkin__progress"
          role="progressbar"
          aria-valuenow={progressNumerator}
          aria-valuemin={1}
          aria-valuemax={totalSteps}
        >
          <div className="checkin__progress-bar" style={{ width: `${progress}%` }} />
        </div>
        <p className="checkin__progress-label">
          Step {progressNumerator} of {totalSteps}
        </p>

        <section
          className="panel panel--checkin"
          aria-labelledby={showQ13Step ? 'checkin-q-safety' : 'checkin-q-core'}
        >
          {blockIntro && (
            <div className="checkin__block">
              <p className="checkin__block-title">{blockIntro.title}</p>
              <p className="checkin__block-hint">{blockIntro.hint}</p>
            </div>
          )}

          {currentQuestion && (
            <>
              <h2 id="checkin-q-core" className="checkin__prompt">
                {currentQuestion.prompt}
              </h2>
              <div className="checkin__options" role="radiogroup" aria-labelledby="checkin-q-core">
                {currentQuestion.options.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`checkin__option${coreFlat[step] === opt.value ? ' checkin__option--selected' : ''}`}
                    onClick={() => selectOption(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </>
          )}

          {showQ13Step && (
            <>
              <h2 id="checkin-q-safety" className="checkin__prompt">
                {SAFETY_QUESTION.prompt}
              </h2>
              <p className="checkin__skip-note">You can skip this question. If you are in immediate danger, contact local emergency services.</p>
              <div className="checkin__options" role="radiogroup" aria-labelledby="checkin-q-safety">
                {SAFETY_QUESTION.options.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`checkin__option${q13 === opt.value ? ' checkin__option--selected' : ''}`}
                    onClick={() => handleQ13Select(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <button type="button" className="btn btn--ghost checkin__skip" onClick={handleSkipQ13}>
                Skip this question
              </button>
            </>
          )}
        </section>

        <div className="checkin__nav">
          <button type="button" className="btn btn--ghost" onClick={goBack} disabled={step === 0}>
            Back
          </button>
          {step < 11 && (
            <button type="button" className="btn btn--primary" onClick={goNext} disabled={!canGoNext}>
              Next
            </button>
          )}
          {step === 11 && (
            <button type="button" className="btn btn--primary" onClick={goNext} disabled={!canGoNext}>
              {labelStep11}
            </button>
          )}
          {showQ13Step && (
            <button type="button" className="btn btn--primary" onClick={submitQ13} disabled={q13 === undefined}>
              Continue
            </button>
          )}
        </div>
      </div>
    </main>
  )
}
