export type ScaleOption = { value: number; label: string }

export type QuestionBlock = 'mood' | 'wellbeing' | 'function' | 'support'

export type AssessmentQuestion = {
  id: string
  block: QuestionBlock
  prompt: string
  options: ScaleOption[]
}

/** PHQ/GAD-style frequency 0–3 */
export const SCALE_FREQ: ScaleOption[] = [
  { value: 0, label: 'Not at all' },
  { value: 1, label: 'Several days' },
  { value: 2, label: 'More than half the days' },
  { value: 3, label: 'Nearly every day' },
]

/** WHO-5–style positive 0–5 (higher = better) */
export const SCALE_WELLBEING: ScaleOption[] = [
  { value: 0, label: 'Not at all' },
  { value: 1, label: 'A little' },
  { value: 2, label: 'Somewhat' },
  { value: 3, label: 'Quite a bit' },
  { value: 4, label: 'Mostly' },
  { value: 5, label: 'Completely' },
]

/** Function impact 0–4 */
export const SCALE_FUNCTION: ScaleOption[] = [
  { value: 0, label: 'Not at all' },
  { value: 1, label: 'A little' },
  { value: 2, label: 'Somewhat' },
  { value: 3, label: 'Quite a bit' },
  { value: 4, label: 'Very much' },
]

/** Support: higher value = stronger support (inverted in risk score). */
export const SCALE_SUPPORT: ScaleOption[] = [
  { value: 0, label: 'Not at all' },
  { value: 1, label: 'Rarely' },
  { value: 2, label: 'Sometimes' },
  { value: 3, label: 'Often' },
  { value: 4, label: 'Almost always' },
]

/** Q13: heaviness / hopelessness — Sometimes/Often → safety flow. */
export const SCALE_SAFETY: ScaleOption[] = [
  { value: 0, label: 'Never' },
  { value: 1, label: 'Rarely' },
  { value: 2, label: 'Sometimes' },
  { value: 3, label: 'Often' },
]

export const CORE_QUESTIONS: AssessmentQuestion[] = [
  {
    id: 'q1',
    block: 'mood',
    prompt: 'Over the last two weeks, how often have you felt down, low, or hopeless?',
    options: SCALE_FREQ,
  },
  {
    id: 'q2',
    block: 'mood',
    prompt: 'How often have you felt nervous, on edge, or worried?',
    options: SCALE_FREQ,
  },
  {
    id: 'q3',
    block: 'mood',
    prompt: 'How often has worry or overthinking been hard to control?',
    options: SCALE_FREQ,
  },
  {
    id: 'q4',
    block: 'mood',
    prompt: 'How often have you felt little interest or pleasure in things you usually enjoy?',
    options: SCALE_FREQ,
  },
  {
    id: 'q5',
    block: 'wellbeing',
    prompt: 'I have felt calm and relaxed.',
    options: SCALE_WELLBEING,
  },
  {
    id: 'q6',
    block: 'wellbeing',
    prompt: 'I have felt active and full of energy.',
    options: SCALE_WELLBEING,
  },
  {
    id: 'q7',
    block: 'wellbeing',
    prompt: 'My daily life has felt meaningful.',
    options: SCALE_WELLBEING,
  },
  {
    id: 'q8',
    block: 'wellbeing',
    prompt: 'I have been able to engage with study, work, or things that matter to me.',
    options: SCALE_WELLBEING,
  },
  {
    id: 'q9',
    block: 'function',
    prompt: 'How much have low mood or stress affected your focus or concentration?',
    options: SCALE_FUNCTION,
  },
  {
    id: 'q10',
    block: 'function',
    prompt: 'How much have they affected your study, work, or daily tasks?',
    options: SCALE_FUNCTION,
  },
  {
    id: 'q11',
    block: 'function',
    prompt: 'How much have they affected your sleep?',
    options: SCALE_FUNCTION,
  },
  {
    id: 'q12',
    block: 'support',
    prompt: 'Is there someone you can talk to honestly when things feel heavy?',
    options: SCALE_SUPPORT,
  },
]

export const SAFETY_QUESTION = {
  id: 'q13',
  prompt:
    'In the last two weeks, how often have you felt things might not be worth continuing, or felt a heavy emptiness that frightened you?',
  options: SCALE_SAFETY,
} as const

export const SECTION_LABELS: Record<QuestionBlock, { title: string; hint: string }> = {
  mood: {
    title: 'Mood & anxiety',
    hint: 'Four questions on mood, worry, and overthinking.',
  },
  wellbeing: {
    title: 'Wellbeing',
    hint: 'WHO-5–inspired: calm, energy, meaning, and engagement.',
  },
  function: {
    title: 'Daily function',
    hint: 'How feelings affect study, work, focus, and sleep.',
  },
  support: {
    title: 'Support',
    hint: 'Whether you have someone you can talk to honestly.',
  },
}
