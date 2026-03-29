/** Mirrors questionnaire + scoring from Mindcare / nepali-mind-check.lovable.app */

export type QuestionOption = { value: number; label: string }

export type NlnQuestion = {
  id: string
  section: 'Mood & Anxiety' | 'Wellbeing' | 'Daily Function' | 'Support' | 'Safety'
  text: string
  options: QuestionOption[]
  /** Safety item — special scoring (override), not in numeric total `l`. */
  isSafety?: boolean
}

export const OPTIONS_MOOD: QuestionOption[] = [
  { value: 0, label: 'Not at all' },
  { value: 1, label: 'Several days' },
  { value: 2, label: 'More than half the days' },
  { value: 3, label: 'Nearly every day' },
]

export const OPTIONS_WELLBEING: QuestionOption[] = [
  { value: 0, label: 'Not at all' },
  { value: 1, label: 'A little' },
  { value: 2, label: 'Somewhat' },
  { value: 3, label: 'A lot' },
  { value: 4, label: 'Extremely' },
]

export const OPTIONS_SAFETY: QuestionOption[] = [
  { value: 0, label: 'No' },
  { value: 1, label: 'Sometimes' },
  { value: 2, label: 'Often' },
  { value: 3, label: 'Skip' },
]

export const NLN_QUESTIONS: NlnQuestion[] = [
  { id: 'Q1', section: 'Mood & Anxiety', text: "I didn't feel interested in things I usually enjoy.", options: OPTIONS_MOOD },
  { id: 'Q2', section: 'Mood & Anxiety', text: 'I felt emotionally low, hopeless, or numb.', options: OPTIONS_MOOD },
  { id: 'Q3', section: 'Mood & Anxiety', text: 'I felt nervous, anxious, or constantly on edge.', options: OPTIONS_MOOD },
  { id: 'Q4', section: 'Mood & Anxiety', text: 'I found it hard to stop overthinking or worrying.', options: OPTIONS_MOOD },
  { id: 'Q5', section: 'Wellbeing', text: 'I felt calm and emotionally balanced.', options: OPTIONS_WELLBEING },
  { id: 'Q6', section: 'Wellbeing', text: 'I had enough energy to get through the day.', options: OPTIONS_WELLBEING },
  { id: 'Q7', section: 'Wellbeing', text: 'My day-to-day life felt meaningful.', options: OPTIONS_WELLBEING },
  { id: 'Q8', section: 'Wellbeing', text: 'I felt interested in what was happening around me.', options: OPTIONS_WELLBEING },
  { id: 'Q9', section: 'Daily Function', text: 'My emotions made it harder to study or work.', options: OPTIONS_WELLBEING },
  { id: 'Q10', section: 'Daily Function', text: 'My emotions made it harder to focus.', options: OPTIONS_WELLBEING },
  { id: 'Q11', section: 'Daily Function', text: 'My emotions made it harder to sleep well.', options: OPTIONS_WELLBEING },
  { id: 'Q12', section: 'Support', text: 'I have at least one person I can talk to honestly.', options: OPTIONS_WELLBEING },
  {
    id: 'Q13',
    section: 'Safety',
    text: 'Recently, have you felt like life is too heavy or not worth continuing?',
    options: OPTIONS_SAFETY,
    isSafety: true,
  },
]

export const NLN_SECTION_COPY: Record<
  NlnQuestion['section'],
  { title: string; instruction: string }
> = {
  'Mood & Anxiety': {
    title: 'Section 1: Mood & Anxiety',
    instruction: 'Over the last 2 weeks, how often have you felt this way?',
  },
  Wellbeing: {
    title: 'Section 2: Wellbeing',
    instruction: 'Over the last 2 weeks, how true were these for you?',
  },
  'Daily Function': {
    title: 'Section 3: Daily Function',
    instruction: 'How much have your emotions affected these areas recently?',
  },
  Support: {
    title: 'Section 4: Support',
    instruction: 'How true is this for you right now?',
  },
  Safety: {
    title: 'One more question',
    instruction: 'This question is personal. You can skip it if you want.',
  },
}

export type NlnAnswer = { questionId: string; value: number }

export type NlnComputedResult = {
  zoneId: 'green' | 'yellow' | 'orange' | 'red'
  totalRisk: number
  safetyOverride: boolean
  zoneDisplayName: string
  explanation: string
}

function valueFor(answers: NlnAnswer[], id: string): number {
  return answers.find((a) => a.questionId === id)?.value ?? 0
}

/** Same scoring as reference app `aD`. */
export function computeNlnResult(answers: NlnAnswer[]): NlnComputedResult {
  const n = valueFor(answers, 'Q1') + valueFor(answers, 'Q2') + valueFor(answers, 'Q3') + valueFor(answers, 'Q4')
  const r = valueFor(answers, 'Q5') + valueFor(answers, 'Q6') + valueFor(answers, 'Q7') + valueFor(answers, 'Q8')
  const o = valueFor(answers, 'Q9') + valueFor(answers, 'Q10') + valueFor(answers, 'Q11')
  const i = valueFor(answers, 'Q12')
  const s = 20 - r
  const a = 4 - i
  const l = n + s + o + a

  const q13 = answers.find((x) => x.questionId === 'Q13')
  if (q13 !== undefined && (q13.value === 1 || q13.value === 2)) {
    return {
      zoneId: 'red',
      totalRisk: l,
      safetyOverride: true,
      zoneDisplayName: 'Needs Human Support',
      explanation:
        'Thank you for answering honestly. Your response suggests that you may need real human support right now, and your wellbeing matters.',
    }
  }

  if (l <= 12) {
    return {
      zoneId: 'green',
      totalRisk: l,
      safetyOverride: false,
      zoneDisplayName: 'Green Zone — Doing Okay',
      explanation:
        "You seem to be in a relatively steady place right now. That doesn't mean life is always easy, but your answers suggest you're managing okay overall.",
    }
  }
  if (l <= 22) {
    return {
      zoneId: 'yellow',
      totalRisk: l,
      safetyOverride: false,
      zoneDisplayName: 'Yellow Zone — Under Pressure',
      explanation:
        'You may be carrying more pressure than usual right now. Your answers suggest some emotional strain, and this may be a good time to understand what is affecting you.',
    }
  }
  if (l <= 34) {
    return {
      zoneId: 'orange',
      totalRisk: l,
      safetyOverride: false,
      zoneDisplayName: 'Orange Zone — Struggling',
      explanation:
        'You may be going through a difficult emotional period. Your answers suggest that this may be affecting your daily life in a meaningful way.',
    }
  }
  return {
    zoneId: 'red',
    totalRisk: l,
    safetyOverride: false,
    zoneDisplayName: 'Red Zone — Needs Human Support',
    explanation:
      'Your answers suggest you may be carrying a heavy emotional load right now. This may be more than something you should have to handle alone.',
  }
}
