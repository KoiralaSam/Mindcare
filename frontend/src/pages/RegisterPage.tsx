import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import type { AgeRange } from '../auth/types'
import { ThemeToggle } from '../components/landing/ThemeToggle'

const AGE_OPTIONS: { value: AgeRange; label: string }[] = [
  { value: '13-17', label: '13–17' },
  { value: '18-24', label: '18–24' },
  { value: '25-34', label: '25–34' },
  { value: '35-44', label: '35–44' },
  { value: '45-54', label: '45–54' },
  { value: '55+', label: '55+' },
  { value: 'prefer-not', label: 'Prefer not to say' },
]

const COUNTRIES = [
  { value: 'NP', label: 'Nepal' },
  { value: 'IN', label: 'India' },
  { value: 'OTHER', label: 'Other / not listed' },
] as const

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'ne', label: 'Nepali (नेपाली)' },
  { value: 'hi', label: 'Hindi' },
  { value: 'other', label: 'Other' },
] as const

export function RegisterPage() {
  const { email, signUp } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  const [formEmail, setFormEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [preferredName, setPreferredName] = useState('')
  const [ageRange, setAgeRange] = useState<AgeRange>('18-24')
  const [country, setCountry] = useState('NP')
  const [primaryLanguage, setPrimaryLanguage] = useState('en')
  const [emergencyName, setEmergencyName] = useState('')
  const [emergencyPhone, setEmergencyPhone] = useState('')
  const [consentClinical, setConsentClinical] = useState(false)
  const [consentTerms, setConsentTerms] = useState(false)
  const [consentPrivacy, setConsentPrivacy] = useState(false)

  useEffect(() => {
    if (email) {
      navigate('/dashboard', { replace: true })
    }
  }, [email, navigate])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    const trimmedEmail = formEmail.trim().toLowerCase()
    if (!trimmedEmail) {
      setError('Enter your email.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    const en = emergencyName.trim()
    const ep = emergencyPhone.trim()
    if ((en && !ep) || (!en && ep)) {
      setError('Provide both a name and phone for your emergency contact, or leave both empty.')
      return
    }
    if (!consentClinical || !consentTerms || !consentPrivacy) {
      setError('Please confirm all required agreements.')
      return
    }
    setPending(true)
    const err = await signUp({
      email: trimmedEmail,
      password,
      preferredName: preferredName.trim() || (trimmedEmail.split('@')[0] ?? 'there'),
      ageRange,
      country,
      primaryLanguage,
      emergencyContactName: en,
      emergencyContactPhone: ep,
      understoodNotClinical: consentClinical,
      acceptedTerms: consentTerms,
      acceptedPrivacy: consentPrivacy,
    })
    setPending(false)
    if (err) {
      setError(err)
      return
    }
    navigate('/dashboard', { replace: true })
  }

  return (
    <main className="shell shell--auth">
      <section className="panel panel--register" aria-labelledby="register-title">
        <div className="auth__top">
          <Link to="/" className="auth__home">
            ← NLN Mindcare
          </Link>
          <ThemeToggle />
        </div>

        <nav className="auth__tabs" aria-label="Account">
          <Link to="/login" className="auth__tab">
            Sign in
          </Link>
          <span className="auth__tab auth__tab--active" aria-current="page">
            Create account
          </span>
        </nav>

        <h1 id="register-title" className="title title--sm">
          Create your account
        </h1>
        <p className="lede auth__lede">
          We ask for a few details so we can address you properly, show age-appropriate guidance, record
          informed consent for a wellbeing tool (not clinical care), and optionally store someone to reach
          if you ever use crisis-oriented features. You can change most of this later when a profile screen
          exists.
        </p>

        <form className="form form--register" onSubmit={handleSubmit} noValidate>
          <fieldset className="form-section">
            <legend className="form-section__title">Account</legend>
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
              <span className="field__label">Password</span>
              <input
                type="password"
                name="password"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <label className="field">
              <span className="field__label">Confirm password</span>
              <input
                type="password"
                name="confirm"
                autoComplete="new-password"
                placeholder="Repeat password"
                required
                minLength={8}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </label>
          </fieldset>

          <fieldset className="form-section">
            <legend className="form-section__title">About you</legend>
            <label className="field">
              <span className="field__label">Preferred name</span>
              <input
                type="text"
                name="preferredName"
                autoComplete="nickname"
                placeholder="How we should greet you"
                required
                value={preferredName}
                onChange={(e) => setPreferredName(e.target.value)}
              />
            </label>
            <label className="field">
              <span className="field__label">Age range</span>
              <select
                name="ageRange"
                required
                value={ageRange}
                onChange={(e) => setAgeRange(e.target.value as AgeRange)}
              >
                {AGE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <p className="form-hint">
              If you are 13–17, consider using Mindcare alongside a trusted adult — the app does not replace
              counselling or emergency services.
            </p>
            <label className="field">
              <span className="field__label">Country / region</span>
              <select name="country" required value={country} onChange={(e) => setCountry(e.target.value)}>
                {COUNTRIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="field__label">Primary language</span>
              <select
                name="primaryLanguage"
                required
                value={primaryLanguage}
                onChange={(e) => setPrimaryLanguage(e.target.value)}
              >
                {LANGUAGES.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
            </label>
          </fieldset>

          <fieldset className="form-section">
            <legend className="form-section__title">Agreements (required)</legend>
            <label className="field-check">
              <input
                type="checkbox"
                checked={consentClinical}
                onChange={(e) => setConsentClinical(e.target.checked)}
                required
              />
              <span>
                I understand NLN Mindcare is for self-reflection and education. It is{' '}
                <strong>not</strong> emergency care, therapy, or a medical diagnosis.
              </span>
            </label>
            <label className="field-check">
              <input
                type="checkbox"
                checked={consentTerms}
                onChange={(e) => setConsentTerms(e.target.checked)}
                required
              />
              <span>I have read and accept the Terms of Service (placeholder until legal pages ship).</span>
            </label>
            <label className="field-check">
              <input
                type="checkbox"
                checked={consentPrivacy}
                onChange={(e) => setConsentPrivacy(e.target.checked)}
                required
              />
              <span>I have read and accept the Privacy Policy (placeholder until legal pages ship).</span>
            </label>
          </fieldset>

          <fieldset className="form-section">
            <legend className="form-section__title">Emergency contact (optional)</legend>
            <p className="form-hint">
              If you choose to add someone, we may use this only in line with future safety features — not
              for marketing. Leave blank if you prefer.
            </p>
            <label className="field">
              <span className="field__label">Contact name</span>
              <input
                type="text"
                name="emergencyName"
                autoComplete="name"
                placeholder="e.g. family member you trust"
                value={emergencyName}
                onChange={(e) => setEmergencyName(e.target.value)}
              />
            </label>
            <label className="field">
              <span className="field__label">Contact phone</span>
              <input
                type="tel"
                name="emergencyPhone"
                autoComplete="tel"
                placeholder="+977 …"
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value)}
              />
            </label>
          </fieldset>

          {error ? (
            <p className="error" role="alert">
              {error}
            </p>
          ) : null}

          <button type="submit" className="btn btn--primary" disabled={pending}>
            {pending ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="auth__footer-note">
          Demo: accounts are stored in this browser only (<code>localStorage</code> + hashed password). Use a
          real backend before production.
        </p>
      </section>
    </main>
  )
}
