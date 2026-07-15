import { describe, expect, it } from 'vitest'
import type { ConsumptionAssessment } from '../types'
import { analyzeAssessment, trainingProgress } from './engine'

const assessment = (level: 1 | 2 | 3): ConsumptionAssessment => ({
  usageFrequency: level,
  problemSolved: level,
  stateImprovement: level,
  lastingEffect: level,
  repurchaseIntent: level,
  assessedAt: '2026-07-16T01:00:00.000Z',
})

describe('消费效果分析', () => {
  it('按照协议划分高效、一般和低效消费', () => {
    expect(analyzeAssessment(assessment(3))).toMatchObject({ score: 100, level: 'high', label: '高效消费' })
    expect(analyzeAssessment(assessment(2))).toMatchObject({ score: 50, level: 'medium', label: '一般消费' })
    expect(analyzeAssessment(assessment(1))).toMatchObject({ score: 0, level: 'low', label: '低效消费' })
  })

  it('未评价时不制造分析结论', () => {
    expect(analyzeAssessment(null)).toBeNull()
  })

  it('把额度使用率作为柔性的训练阶段参考', () => {
    expect(trainingProgress(850, 1000)).toMatchObject({ ratio: 0.85, stage: 'active' })
    expect(trainingProgress(950, 1000)).toMatchObject({ ratio: 0.95, stage: 'extended' })
  })
})
