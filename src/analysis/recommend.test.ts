import { describe, expect, it } from 'vitest'
import type { ExpenseRecord } from '../types'
import { buildBudgetPlan, suggestFromHistory } from './recommend'

const record = (overrides: Partial<ExpenseRecord>): ExpenseRecord => ({
  id: '1', date: '2026-07-16', amount: 300, purpose: '游泳月卡', reason: '恢复运动', feedback: '每周游泳三次，精神更好',
  assessment: { usageFrequency: 3, problemSolved: 3, stateImprovement: 3, lastingEffect: 3, repurchaseIntent: 3, assessedAt: '2026-07-16T01:00:00.000Z' },
  createdAt: '2026-07-16T01:00:00.000Z', updatedAt: '2026-07-16T01:00:00.000Z', ...overrides,
})

describe('本地需求辅助接口', () => {
  it('优先返回预算内且与个人历史匹配的有效消费', () => {
    const result = suggestFromHistory([record({}), record({ id: '2', purpose: '桌面收纳', reason: '整理房间' })], { description: '恢复运动', budget: 500 })
    expect(result.map((item) => item.purpose)).toEqual(['游泳月卡'])
  })

  it('排除超预算和低效消费', () => {
    expect(suggestFromHistory([record({ amount: 600 })], { description: '恢复运动', budget: 500 })).toEqual([])
    expect(suggestFromHistory([record({ assessment: { usageFrequency: 1, problemSolved: 1, stateImprovement: 1, lastingEffect: 1, repurchaseIntent: 1, assessedAt: '2026-07-16T01:00:00.000Z' } })], { description: '恢复运动', budget: 500 })).toEqual([])
  })

  it('能把个人历史候选组合在总预算内', () => {
    const suggestions = suggestFromHistory([
      record({ id: '1', amount: 300 }),
      record({ id: '2', amount: 180, purpose: '游泳体验课' }),
      record({ id: '3', amount: 260, purpose: '运动按摩' }),
    ], { description: '我想恢复运动，预算500元', budget: 500 })
    const plan = buildBudgetPlan(suggestions, 500)
    expect(plan.reduce((sum, item) => sum + item.amount, 0)).toBeLessThanOrEqual(500)
    expect(plan.length).toBeGreaterThan(0)
  })
})
