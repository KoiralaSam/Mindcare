import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { CheckInResultPage } from './pages/CheckInResultPage'
import { DashboardPage } from './pages/DashboardPage'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { QuickCheckInPage } from './pages/QuickCheckInPage'
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
          {/* Full paths + most-specific-first avoids RR7 nested matching falling through to `*`. */}
          <Route
            path="/dashboard/check-in/result"
            element={
              <ProtectedRoute>
                <CheckInResultPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/check-in"
            element={
              <ProtectedRoute>
                <QuickCheckInPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/safety"
            element={
              <ProtectedRoute>
                <SafetySupportPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
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
