import { useCallback, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { readStoredAssessment, writeStoredAssessment, type StoredAssessment } from './storage'

export function useAssessment() {
  const { email } = useAuth()
  const { pathname } = useLocation()

  /** Re-read when route changes so /dashboard/safety sees the payload just written on check-in. */
  const stored = useMemo(() => {
    void pathname
    return readStoredAssessment(email)
  }, [email, pathname])

  const save = useCallback(
    (payload: StoredAssessment) => {
      if (!email) return
      writeStoredAssessment(email, payload)
    },
    [email],
  )

  return { email, stored, save }
}
