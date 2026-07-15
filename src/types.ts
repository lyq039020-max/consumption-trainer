export type AssessmentLevel = 1 | 2 | 3

export interface ConsumptionAssessment {
  usageFrequency: AssessmentLevel
  problemSolved: AssessmentLevel
  stateImprovement: AssessmentLevel
  lastingEffect: AssessmentLevel
  repurchaseIntent: AssessmentLevel
  assessedAt: string
}

export interface ExpenseRecord {
  id: string
  date: string
  amount: number
  purpose: string
  reason: string
  feedback: string
  assessment: ConsumptionAssessment | null
  createdAt: string
  updatedAt: string
}

export interface MonthlyBudget {
  month: string
  amount: number
}

export interface AppData {
  version: 1
  records: ExpenseRecord[]
  budgets: MonthlyBudget[]
}

export const EMPTY_DATA: AppData = { version: 1, records: [], budgets: [] }
