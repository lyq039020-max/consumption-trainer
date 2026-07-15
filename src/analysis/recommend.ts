import type { ExpenseRecord } from '../types'
import { analyzeRecord } from './engine'

export interface NeedRequest {
  description: string
  budget: number
}

export interface HistorySuggestion {
  recordId: string
  purpose: string
  amount: number
  score: number
  reason: string
  matchScore: number
}

const splitKeywords = (text: string) => {
  const normalized = text.toLowerCase()
    .replace(/\d+(?:\.\d+)?\s*元?/g, ' ')
    .replace(/我最近|我想|希望|想要|预算|以内|可以|一下|用来|通过/g, ' ')
  const segments = normalized.split(/[\s，。！？、；：,.!?;:\-_/]+/).map((item) => item.trim()).filter((item) => item.length >= 2)
  return Array.from(new Set(segments.flatMap((segment) => {
    if (/^[\u3400-\u9fff]+$/.test(segment) && segment.length > 2) {
      return Array.from({ length: segment.length - 1 }, (_, index) => segment.slice(index, index + 2))
    }
    return [segment]
  })))
}

export function suggestFromHistory(records: ExpenseRecord[], request: NeedRequest): HistorySuggestion[] {
  if (!Number.isFinite(request.budget) || request.budget <= 0) return []
  const needs = splitKeywords(request.description)
  return records.flatMap((record) => {
    const analysis = analyzeRecord(record)
    if (!analysis || analysis.level === 'low' || record.amount > request.budget) return []
    const source = `${record.purpose} ${record.reason} ${record.feedback}`.toLowerCase()
    const matches = needs.filter((keyword) => source.includes(keyword)).length
    const matchScore = needs.length ? matches / needs.length : 0
    if (needs.length && matches === 0) return []
    return [{ recordId: record.id, purpose: record.purpose, amount: record.amount, score: analysis.score, reason: analysis.reason, matchScore }]
  }).sort((a, b) => b.matchScore - a.matchScore || b.score - a.score || a.amount - b.amount)
}

export function buildBudgetPlan(suggestions: HistorySuggestion[], budget: number): HistorySuggestion[] {
  if (!Number.isFinite(budget) || budget <= 0) return []
  const ranked = [...suggestions].sort((a, b) => {
    const utilityA = (a.matchScore * 100 + a.score) / a.amount
    const utilityB = (b.matchScore * 100 + b.score) / b.amount
    return utilityB - utilityA || b.score - a.score
  })
  const selected: HistorySuggestion[] = []
  const purposes = new Set<string>()
  let remaining = budget
  for (const suggestion of ranked) {
    const purposeKey = suggestion.purpose.trim().toLowerCase()
    if (suggestion.amount <= remaining && !purposes.has(purposeKey)) {
      selected.push(suggestion)
      purposes.add(purposeKey)
      remaining -= suggestion.amount
    }
  }
  return selected
}
