import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useState } from 'react'
import { mapGenderForAPI, nlnAnswersToWellnessPayload, postWellnessQuiz } from '../../api/wellnessQuiz'
import { useAuth } from '../../auth/AuthContext'
import type { BackendUser } from '../../auth/types'
import {
  computeNlnResult,
  NLN_QUESTIONS,
  NLN_SECTION_COPY,
  type NlnAnswer,
} from '../../assessment/nlnCheckIn'
import { saveWellnessFrontendResult } from '../../assessment/useWellnessFrontendResult'
import { saveAssessment } from '../../assessment/useAssessment'

type Phase = 'welcome' | 'sectionIntro' | 'question'

type Props = {
  /** Called after local save + optional API sync (before you navigate away). */
  onComplete: () => void
}

const slide = {
  initial: { opacity: 0, x: 48 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
}

export function NlnCheckInFlow({ onComplete }: Props) {
  const { email, user, patchUser } = useAuth()
  const [phase, setPhase] = useState<Phase>('welcome')
  const [questionIndex, setQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<NlnAnswer[]>([])
  const [picking, setPicking] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const total = NLN_QUESTIONS.length
  const q = NLN_QUESTIONS[questionIndex]

  const finish = useCallback(
    async (finalAnswers: NlnAnswer[]) => {
      const r = computeNlnResult(finalAnswers)
      saveAssessment({
        zoneId: r.zoneId,
        totalRisk: r.totalRisk,
        completedAt: new Date().toISOString(),
        safetyOverride: r.safetyOverride,
      })

      if (email && user) {
        setSubmitting(true)
        const age =
          typeof user.age === 'number' && !Number.isNaN(user.age) ? Math.round(user.age) : 18
        const api = await postWellnessQuiz({
          email,
          age,
          gender: mapGenderForAPI(user.gender ?? undefined),
          answers: nlnAnswersToWellnessPayload(finalAnswers),
        })
        setSubmitting(false)
        if (api.ok) {
          const patch: Partial<BackendUser> = {}
          if (typeof api.data.daily_ember === 'number') patch.daily_ember = api.data.daily_ember
          if (typeof api.data.streak === 'number') patch.streak = api.data.streak
          if (Object.keys(patch).length > 0) {
            patchUser(patch)
          }
          if (api.data.frontend_result) {
            saveWellnessFrontendResult(api.data.frontend_result)
          }
        }
      }

      onComplete()
    },
    [email, user, onComplete, patchUser],
  )

  function handleOptionPick(value: number) {
    if (picking || submitting) return
    setPicking(true)
    const idx = questionIndex
    const currentQ = NLN_QUESTIONS[idx]
    window.setTimeout(() => {
      const nextAnswers = [...answers, { questionId: currentQ.id, value }]
      if (idx >= total - 1) {
        void finish(nextAnswers).finally(() => {
          setPicking(false)
        })
        return
      }
      const nextIdx = idx + 1
      const nextSection = NLN_QUESTIONS[nextIdx].section
      setAnswers(nextAnswers)
      setQuestionIndex(nextIdx)
      setPhase(nextSection !== currentQ.section ? 'sectionIntro' : 'question')
      setPicking(false)
    }, 280)
  }

  function handleBegin() {
    setQuestionIndex(0)
    setAnswers([])
    setPhase('sectionIntro')
  }

  const sectionMeta = q ? NLN_SECTION_COPY[q.section] : null
  const progressLabel = questionIndex + 1
  const introBarPct = (questionIndex / total) * 100
  const questionBarPct = ((questionIndex + 1) / total) * 100

  return (
    <div className="nln-checkin">
      <AnimatePresence mode="wait">
        {phase === 'welcome' ? (
          <motion.div
            key="welcome"
            className="nln-checkin__panel"
            {...slide}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="nln-checkin__brand">Project NLN</p>
            <h1 className="nln-checkin__title">Emotional Wellbeing Check-in</h1>
            <p className="nln-checkin__body">
              Welcome to Project NLN. This is a short self-check to help you understand where you stand emotionally
              right now.
            </p>
            <p className="nln-checkin__body nln-checkin__body--muted">
              This is not a diagnosis — just a check-in. Please answer based on how you&apos;ve felt recently.
            </p>
            <p className="nln-checkin__chip">Takes about 2 minutes · earn daily embers</p>
            <button type="button" className="nln-checkin__btn nln-checkin__btn--primary" onClick={handleBegin}>
              Begin Check-in
            </button>
          </motion.div>
        ) : null}

        {phase === 'sectionIntro' && sectionMeta ? (
          <motion.div
            key={`intro-${q.section}-${questionIndex}`}
            className="nln-checkin__panel"
            {...slide}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="nln-checkin__progress-wrap">
              <p className="nln-checkin__progress-label">
                {progressLabel} of {total}
              </p>
              <div className="nln-checkin__progress-track">
                <motion.div
                  className="nln-checkin__progress-fill"
                  initial={false}
                  animate={{ width: `${introBarPct}%` }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
            </div>
            <div className="nln-checkin__card">
              <h2 className="nln-checkin__card-title">{sectionMeta.title}</h2>
              <p className="nln-checkin__card-text">{sectionMeta.instruction}</p>
            </div>
            <button
              type="button"
              className="nln-checkin__btn nln-checkin__btn--primary"
              onClick={() => setPhase('question')}
              disabled={submitting}
            >
              Continue
            </button>
          </motion.div>
        ) : null}

        {phase === 'question' && q ? (
          <motion.div
            key={q.id}
            className="nln-checkin__panel"
            {...slide}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="nln-checkin__progress-wrap">
              <p className="nln-checkin__progress-label">
                {progressLabel} of {total}
              </p>
              <div className="nln-checkin__progress-track">
                <motion.div
                  className="nln-checkin__progress-fill"
                  initial={false}
                  animate={{ width: `${questionBarPct}%` }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
            </div>
            <p className="nln-checkin__section-pill">{q.section}</p>
            <p className="nln-checkin__question">{q.text}</p>
            {submitting ? (
              <p className="nln-checkin__submitting" role="status">
                Saving &amp; earning embers…
              </p>
            ) : null}
            <div className="nln-checkin__options" role="group" aria-label="Answer choices">
              {q.options.map((opt) => (
                <motion.button
                  key={opt.value}
                  type="button"
                  className="nln-checkin__option"
                  onClick={() => handleOptionPick(opt.value)}
                  disabled={picking || submitting}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 520, damping: 35 }}
                >
                  {opt.label}
                </motion.button>
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
