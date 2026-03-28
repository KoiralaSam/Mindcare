/** Profile and consent data collected at registration (wellbeing-app context). */
export type UserProfile = {
  preferredName: string
  /** Age band for age-appropriate copy and safeguarding signals (not precise DOB). */
  ageRange: AgeRange
  country: string
  primaryLanguage: string
  emergencyContactName: string
  emergencyContactPhone: string
  consents: {
    understoodNotClinical: boolean
    acceptedTerms: boolean
    acceptedPrivacy: boolean
  }
  createdAt: string
}

export type AgeRange =
  | '13-17'
  | '18-24'
  | '25-34'
  | '35-44'
  | '45-54'
  | '55+'
  | 'prefer-not'

export type StoredUser = {
  passwordHash: string
  profile: UserProfile
}

export type SignUpPayload = {
  email: string
  password: string
  preferredName: string
  ageRange: AgeRange
  country: string
  primaryLanguage: string
  emergencyContactName: string
  emergencyContactPhone: string
  understoodNotClinical: boolean
  acceptedTerms: boolean
  acceptedPrivacy: boolean
}
