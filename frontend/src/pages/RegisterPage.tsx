import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { FlowShell } from '../components/flow/FlowShell'
import { NlnCheckInFlow } from '../components/flow/NlnCheckInFlow'

const GENDER_OPTIONS = [
  { value: 'woman', label: 'Woman' },
  { value: 'man', label: 'Man' },
  { value: 'nonbinary', label: 'Non-binary' },
  { value: 'prefer-not', label: 'Prefer not to say' },
  { value: 'other', label: 'Another identity' },
] as const

export function RegisterPage() {
  const { email, wellnessCompleted, loginWithAPI } = useAuth()
  const navigate = useNavigate()
  const showCheckIn = Boolean(email && !wellnessCompleted)

  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  const [formEmail, setFormEmail] = useState('')
  const [ageStr, setAgeStr] = useState('')
  const [gender, setGender] = useState<string>('')

  useEffect(() => {
    if (email && wellnessCompleted) {
      navigate('/dashboard', { replace: true })
    }
  }, [email, wellnessCompleted, navigate])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    const trimmedEmail = formEmail.trim().toLowerCase()
    if (!trimmedEmail) {
      setError('Enter your email.')
      return
    }
    const age = Number.parseInt(ageStr, 10)
    if (!Number.isFinite(age) || age < 13 || age > 120) {
      setError('Enter your age (13–120).')
      return
    }
    if (!gender) {
      setError('Choose how you’d like gender recorded.')
      return
    }
    setPending(true)
    const err = await loginWithAPI({
      email: trimmedEmail,
      age,
      gender,
    })
    setPending(false)
    if (err) {
      setError(err)
      return
    }
  }

  return (
    <main className="flow-shell__main flow-shell__main--wide">
      <FlowShell title="Mindcare" backTo="/" backLabel="Back to home">
        {showCheckIn ? (
          <NlnCheckInFlow
            onComplete={() => {
              navigate('/welcome/summary', { replace: true, state: { next: '/dashboard' } })
            }}
          />
        ) : (
          <div className="flow-step">
            <nav className="flow-tabs" aria-label="Account">
              <Link to="/login" className="flow-tabs__item">
                Sign in
              </Link>
              <span className="flow-tabs__item flow-tabs__item--active">Create account</span>
            </nav>

            <h1 className="flow-step__title flow-step__title--tight">Create account</h1>
            <p className="flow-step__lede flow-step__lede--tight">
              Email, age, and gender — then the full Mindcare emotional wellbeing check-in (about 2 minutes).
            </p>

            <form className="flow-form flow-form--light" onSubmit={handleSubmit} noValidate>
              <label className="field">
                <span className="field__label">Email</span>
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  inputMode="email"
                  placeholder="you@example.com"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                />
              </label>
              <label className="field">
                <span className="field__label">Age</span>
                <input
                  type="number"
                  name="age"
                  inputMode="numeric"
                  min={13}
                  max={120}
                  placeholder="Your age"
                  required
                  value={ageStr}
                  onChange={(e) => setAgeStr(e.target.value)}
                />
              </label>
              <label className="field">
                <span className="field__label">Gender</span>
                <select name="gender" required value={gender} onChange={(e) => setGender(e.target.value)}>
                  <option value="">Choose one</option>
                  {GENDER_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>

              {error ? (
                <p className="error" role="alert">
                  {error}
                </p>
              ) : null}

              <button type="submit" className="btn flow-btn-continue" disabled={pending}>
                {pending ? 'Saving…' : 'Continue'}
              </button>
            </form>

            <p className="flow-footnote">
              Already have an account?{' '}
              <Link to="/login" className="flow-link">
                Sign in
              </Link>
            </p>
          </div>
        )}
      </FlowShell>
    </main>
  )
}
