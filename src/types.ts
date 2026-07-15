export interface ExpenseRecord {
  id: string
  date: string
  amount: number
  purpose: string
  feedback: string
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
