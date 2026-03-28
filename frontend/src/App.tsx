import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { DashboardPage } from './pages/DashboardPage'
import { LeaderboardPage } from './pages/LeaderboardPage'
import { WellnessSummaryPage } from './pages/WellnessSummaryPage'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { SafetySupportPage } from './pages/SafetySupportPage'
import { ProtectedRoute } from './routes/ProtectedRoute'

export default function App() {
  return (
    <AuthProvider>
      <div className="app">
        <div className="bg-grid" aria-hidden />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/welcome/wellness" element={<Navigate to="/login" replace />} />
          <Route
            path="/welcome/summary"
            element={
              <ProtectedRoute>
                <WellnessSummaryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/safety"
            element={
              <ProtectedRoute requireWellness>
                <SafetySupportPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/leaderboard"
            element={
              <ProtectedRoute requireWellness>
                <LeaderboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute requireWellness>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </AuthProvider>
  )
}
