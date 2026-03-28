import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { DashboardLayout } from '../components/dashboard/DashboardLayout'
import { fetchLeaderboard, type LeaderboardEntry } from '../api/leaderboard'

export function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    fetchLeaderboard(50)
      .then((data) => setEntries(data.entries ?? []))
      .catch(() => {
        setError('Could not load leaderboard.')
        setEntries(null)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return (
    <DashboardLayout>
      <main className="dash-app__main">
        <div className="dash-app__main-inner leaderboard-page">
          <p className="leaderboard-page__back">
            <Link to="/dashboard" className="leaderboard-page__back-link">
              ← Dashboard
            </Link>
          </p>

          <div className="leaderboard-page__card">
            <div
              className={
                loading && entries !== null
                  ? 'dash-app__leaderboard-head dash-app__leaderboard-head--updating'
                  : 'dash-app__leaderboard-head'
              }
            >
              <h1 className="leaderboard-page__title">Streak leaderboard</h1>
              <button type="button" className="dash-app__leaderboard-refresh" onClick={load} disabled={loading}>
                Refresh
              </button>
            </div>

            {loading && entries === null ? (
              <p className="dash-app__leaderboard-status">Loading…</p>
            ) : error ? (
              <p className="dash-app__leaderboard-status dash-app__leaderboard-status--error">{error}</p>
            ) : entries && entries.length === 0 ? (
              <p className="dash-app__leaderboard-status">No players yet.</p>
            ) : (
              <ol className="dash-app__leaderboard-list leaderboard-page__list">
                {entries?.map((row) => (
                  <li key={`${row.rank}-${row.nickname}`} className="dash-app__leaderboard-row">
                    <span className="dash-app__leaderboard-rank" aria-hidden>
                      {row.rank}.
                    </span>
                    <span className="dash-app__leaderboard-name">{row.nickname}</span>
                    <span className="dash-app__leaderboard-streak" title="Day streak">
                      <span aria-hidden>🔥</span> {row.streak}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </main>
    </DashboardLayout>
  )
}
