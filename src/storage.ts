import type { AppData, ExpenseRecord, MonthlyBudget } from './types'
import { EMPTY_DATA } from './types'

export const STORAGE_KEY = 'spending-training-data-v1'

const isDate = (value: unknown): value is string =>
  typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00`))

const isMonth = (value: unknown): value is string =>
  typeof value === 'string' && /^\d{4}-\d{2}$/.test(value)

const isPositiveNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0

export function validateData(value: unknown): AppData {
  if (!value || typeof value !== 'object') throw new Error('文件内容不是有效的数据对象')
  const data = value as Partial<AppData>
  if (data.version !== 1 || !Array.isArray(data.records) || !Array.isArray(data.budgets)) {
    throw new Error('数据版本或结构不正确')
  }

  const ids = new Set<string>()
  const records: ExpenseRecord[] = data.records.map((item, index) => {
    if (!item || typeof item !== 'object') throw new Error(`第 ${index + 1} 条记录格式不正确`)
    const record = item as Partial<ExpenseRecord>
    if (typeof record.id !== 'string' || !record.id || ids.has(record.id)) throw new Error('记录 ID 缺失或重复')
    if (!isDate(record.date) || !isPositiveNumber(record.amount)) throw new Error(`第 ${index + 1} 条记录的日期或金额不正确`)
    if (typeof record.purpose !== 'string' || !record.purpose.trim()) throw new Error(`第 ${index + 1} 条记录缺少用途`)
    if ((record.reason !== undefined && typeof record.reason !== 'string') || typeof record.feedback !== 'string' || typeof record.createdAt !== 'string' || typeof record.updatedAt !== 'string') {
      throw new Error(`第 ${index + 1} 条记录字段不完整`)
    }
    if (Number.isNaN(Date.parse(record.createdAt)) || Number.isNaN(Date.parse(record.updatedAt))) throw new Error('记录时间格式不正确')
    ids.add(record.id)
    return { ...record, purpose: record.purpose.trim(), reason: record.reason?.trim() ?? '', feedback: record.feedback.trim() } as ExpenseRecord
  })

  const months = new Set<string>()
  const budgets: MonthlyBudget[] = data.budgets.map((item) => {
    if (!item || typeof item !== 'object') throw new Error('额度格式不正确')
    const budget = item as Partial<MonthlyBudget>
    if (!isMonth(budget.month) || !isPositiveNumber(budget.amount) || months.has(budget.month)) throw new Error('额度月份或金额不正确')
    months.add(budget.month)
    return budget as MonthlyBudget
  })

  return { version: 1, records, budgets }
}

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? validateData(JSON.parse(raw)) : { ...EMPTY_DATA, records: [], budgets: [] }
  } catch {
    return { ...EMPTY_DATA, records: [], budgets: [] }
  }
}

export function saveData(data: AppData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function effectiveBudget(budgets: MonthlyBudget[], month: string): { amount: number | null; inherited: boolean } {
  const exact = budgets.find((budget) => budget.month === month)
  if (exact) return { amount: exact.amount, inherited: false }
  const previous = budgets
    .filter((budget) => budget.month < month)
    .sort((a, b) => b.month.localeCompare(a.month))[0]
  return { amount: previous?.amount ?? null, inherited: Boolean(previous) }
}
