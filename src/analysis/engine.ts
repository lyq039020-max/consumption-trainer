import type { ConsumptionAssessment, ExpenseRecord } from '../types'
import { CLASSIFICATION_THRESHOLDS, CRITERIA, TRAINING_PROGRESS_REFERENCE } from './config'

export type EfficiencyLevel = 'high' | 'medium' | 'low'

export interface ConsumptionAnalysis {
  score: number
  level: EfficiencyLevel
  label: string
  reason: string
}

const labels: Record<EfficiencyLevel, string> = {
  high: '高效消费',
  medium: '一般消费',
  low: '低效消费',
}

export function analyzeAssessment(assessment: ConsumptionAssessment | null): ConsumptionAnalysis | null {
  if (!assessment) return null
  const parts = CRITERIA.map((criterion) => {
    const value = assessment[criterion.key]
    const normalized = ((value - 1) / 2) * 100
    const option = criterion.options.find((item) => item.value === value)
    return { value, contribution: normalized * criterion.weight, explanation: option?.explanation ?? criterion.label }
  })
  const score = Math.round(parts.reduce((sum, part) => sum + part.contribution, 0))
  const level: EfficiencyLevel = score >= CLASSIFICATION_THRESHOLDS.high ? 'high' : score >= CLASSIFICATION_THRESHOLDS.medium ? 'medium' : 'low'
  const strongest = [...parts].sort((a, b) => b.value - a.value || b.contribution - a.contribution)[0]
  const weakest = [...parts].sort((a, b) => a.value - b.value || a.contribution - b.contribution)[0]
  const reason = level === 'high'
    ? strongest.explanation
    : level === 'low'
      ? weakest.explanation
      : `${strongest.explanation}，但${weakest.explanation}`
  return { score, level, label: labels[level], reason }
}

export function analyzeRecord(record: ExpenseRecord) {
  return analyzeAssessment(record.assessment)
}

export function trainingProgress(spent: number, budget: number | null) {
  if (!budget || budget <= 0) return { ratio: null, stage: 'unset' as const }
  const ratio = spent / budget
  const stage = ratio < TRAINING_PROGRESS_REFERENCE.activeStart
    ? 'exploring' as const
    : ratio <= TRAINING_PROGRESS_REFERENCE.activeTarget
      ? 'active' as const
      : 'extended' as const
  return { ratio, stage }
}
