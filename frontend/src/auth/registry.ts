import type { SignUpPayload, StoredUser, UserProfile } from './types'

/** Demo: registered accounts (replace with API). Not for production secrets. */
const REGISTRY_KEY = 'g7:user-registry'

export async function hashPassword(password: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export function readRegistry(): Record<string, StoredUser> {
  try {
    const raw = localStorage.getItem(REGISTRY_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, StoredUser>
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeRegistry(registry: Record<string, StoredUser>) {
  localStorage.setItem(REGISTRY_KEY, JSON.stringify(registry))
}

export async function registerUser(payload: SignUpPayload): Promise<string | null> {
  const email = payload.email.trim().toLowerCase()
  const registry = readRegistry()
  if (registry[email]) {
    return 'An account with this email already exists. Sign in instead.'
  }
  if (payload.password.length < 8) {
    return 'Password must be at least 8 characters.'
  }
  if (!payload.understoodNotClinical || !payload.acceptedTerms || !payload.acceptedPrivacy) {
    return 'All required agreements must be accepted.'
  }
  const profile: UserProfile = {
    preferredName: payload.preferredName.trim(),
    ageRange: payload.ageRange,
    country: payload.country,
    primaryLanguage: payload.primaryLanguage,
    emergencyContactName: payload.emergencyContactName.trim(),
    emergencyContactPhone: payload.emergencyContactPhone.trim(),
    consents: {
      understoodNotClinical: payload.understoodNotClinical,
      acceptedTerms: payload.acceptedTerms,
      acceptedPrivacy: payload.acceptedPrivacy,
    },
    createdAt: new Date().toISOString(),
  }
  const passwordHash = await hashPassword(payload.password)
  registry[email] = { passwordHash, profile }
  writeRegistry(registry)
  return null
}

export async function verifyCredentials(
  email: string,
  password: string,
): Promise<{ ok: true; profile: UserProfile } | { ok: false }> {
  const key = email.trim().toLowerCase()
  const registry = readRegistry()
  const row = registry[key]
  if (!row) return { ok: false }
  const h = await hashPassword(password)
  if (h !== row.passwordHash) return { ok: false }
  return { ok: true, profile: row.profile }
}
