import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { useAssessment } from '../../assessment/useAssessment'

function initials(nickname: string): string {
  const t = nickname.trim()
  if (!t) return '?'
  const parts = t.split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0]![0]! + parts[1]![0]!).toUpperCase()
  }
  return t.slice(0, 2).toUpperCase()
}

const EMBER_BAR_CAP = 100

type Props = {
  children: ReactNode
}

/** Shared shell: Mindcare brand, leaderboard, optional Support, streak, embers, profile menu. */
export function DashboardLayout({ children }: Props) {
  const navigate = useNavigate()
  const { email, user, signOut } = useAuth()
  const { stored } = useAssessment()
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const profileMenuRef = useRef<HTMLDivElement>(null)

  const nickname = user?.nickname?.trim() || email?.split('@')[0] || 'Friend'
  const avatarSrc = user?.avatar?.trim()

  const streak = user?.streak ?? 0
  const embers = user?.daily_ember ?? 0
  const emberBarPct = Math.min(100, (embers / EMBER_BAR_CAP) * 100)

  useEffect(() => {
    if (!profileMenuOpen) return
    function onPointerDown(e: PointerEvent) {
      const profileEl = profileMenuRef.current
      const t = e.target as Node
      if (profileEl && !profileEl.contains(t)) {
        setProfileMenuOpen(false)
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setProfileMenuOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [profileMenuOpen])

  function handleSignOut() {
    setProfileMenuOpen(false)
    signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="dash-app">
      <div className="dash-app__shell">
        <header className="dash-app__topbar">
          <div className="dash-app__topbar-brand">
            <Link to="/dashboard" className="dash-app__brand-wordmark">
              Mindcare
            </Link>
          </div>
          <div className="dash-app__topbar-actions">
            <div className="dash-app__topbar-nav">
              <Link to="/dashboard/leaderboard" className="dash-app__leaderboard-link">
                <span className="dash-app__leaderboard-link-icon" aria-hidden>
                  🏆
                </span>
                <span className="dash-app__leaderboard-link-text">Leaderboard</span>
              </Link>
              {stored?.safetyOverride ? (
                <Link to="/dashboard/safety" className="dash-app__support-link">
                  Support
                </Link>
              ) : null}
            </div>
            <div className="dash-app__topbar-stats">
              <div className="dash-app__streak" title="Day streak" aria-label={`${streak} day streak`}>
                <span className="dash-app__streak-icon" aria-hidden>
                  🔥
                </span>
                <span className="dash-app__streak-value">{streak}</span>
              </div>
              <div className="dash-app__ember-wrap" title={`Embers: ${embers}`}>
                <span className="dash-app__ember-icon" aria-hidden>
                  ✦
                </span>
                <div
                  className="dash-app__ember-bar"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={EMBER_BAR_CAP}
                  aria-valuenow={embers}
                  aria-label="Daily embers"
                >
                  <div className="dash-app__ember-fill" style={{ width: `${emberBarPct}%` }} />
                </div>
                <span className="dash-app__ember-label">{embers}</span>
              </div>
              <div className="dash-app__profile-menu" ref={profileMenuRef}>
                <button
                  type="button"
                  className="dash-app__profile-trigger"
                  aria-expanded={profileMenuOpen}
                  aria-haspopup="menu"
                  aria-controls="dash-profile-menu"
                  id="dash-profile-trigger"
                  onClick={() => setProfileMenuOpen((o) => !o)}
                >
                  {avatarSrc ? (
                    <img src={avatarSrc} alt="" className="dash-app__avatar-img" width={40} height={40} />
                  ) : (
                    <span className="dash-app__avatar-fallback" aria-hidden>
                      {initials(nickname)}
                    </span>
                  )}
                  <span className="dash-app__nickname">{nickname}</span>
                  <span className="dash-app__profile-chevron" aria-hidden>
                    ▾
                  </span>
                </button>
                {profileMenuOpen ? (
                  <div
                    id="dash-profile-menu"
                    role="menu"
                    aria-labelledby="dash-profile-trigger"
                    className="dash-app__profile-dropdown"
                  >
                    <button type="button" role="menuitem" className="dash-app__profile-logout" onClick={handleSignOut}>
                      Log out
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </header>
        {children}
      </div>
    </div>
  )
}
