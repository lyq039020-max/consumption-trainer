import { beforeEach, describe, expect, it } from 'vitest'
import { effectiveBudget, loadData, saveData, validateData } from './storage'

describe('本地数据', () => {
  beforeEach(() => localStorage.clear())

  it('保存并读取全部数据', () => {
    const data = { version: 1 as const, records: [], budgets: [{ month: '2026-07', amount: 2000 }] }
    saveData(data)
    expect(loadData()).toEqual(data)
  })

  it('新月份沿用最近的历史额度', () => {
    const result = effectiveBudget([{ month: '2026-05', amount: 800 }, { month: '2026-06', amount: 1200 }], '2026-07')
    expect(result).toEqual({ amount: 1200, inherited: true })
  })

  it('当前月明确额度优先于继承额度', () => {
    const result = effectiveBudget([{ month: '2026-06', amount: 1200 }, { month: '2026-07', amount: 1500 }], '2026-07')
    expect(result).toEqual({ amount: 1500, inherited: false })
  })

  it('拒绝异常导入数据', () => {
    expect(() => validateData({ version: 1, records: [{ id: 'x' }], budgets: [] })).toThrow()
    expect(() => validateData({ version: 1, records: [], budgets: [{ month: 'bad', amount: -1 }] })).toThrow()
  })
})
