import type { AssessmentLevel, ConsumptionAssessment } from '../types'

export type AssessmentKey = Exclude<keyof ConsumptionAssessment, 'assessedAt'>

export interface CriterionConfig {
  key: AssessmentKey
  label: string
  weight: number
  options: ReadonlyArray<{ value: AssessmentLevel; label: string; explanation: string }>
}

export const ANALYSIS_PROTOCOL_VERSION = 1

export const CRITERIA: ReadonlyArray<CriterionConfig> = [
  {
    key: 'usageFrequency', label: '实际使用', weight: 0.2,
    options: [
      { value: 1, label: '很少', explanation: '实际使用较少' },
      { value: 2, label: '偶尔', explanation: '有一定使用频率' },
      { value: 3, label: '经常', explanation: '保持了较高使用频率' },
    ],
  },
  {
    key: 'problemSolved', label: '解决问题', weight: 0.3,
    options: [
      { value: 1, label: '不明显', explanation: '没有明显解决原本的问题' },
      { value: 2, label: '一部分', explanation: '部分解决了原本的问题' },
      { value: 3, label: '很明显', explanation: '有效解决了原本的问题' },
    ],
  },
  {
    key: 'stateImprovement', label: '状态提升', weight: 0.2,
    options: [
      { value: 1, label: '没有', explanation: '对状态的改善不明显' },
      { value: 2, label: '有一点', explanation: '对状态有一些改善' },
      { value: 3, label: '很明显', explanation: '明显改善了个人状态' },
    ],
  },
  {
    key: 'lastingEffect', label: '效果持续', weight: 0.15,
    options: [
      { value: 1, label: '很短', explanation: '效果持续时间较短' },
      { value: 2, label: '一阵子', explanation: '效果维持了一段时间' },
      { value: 3, label: '到现在', explanation: '效果持续到了现在' },
    ],
  },
  {
    key: 'repurchaseIntent', label: '类似消费', weight: 0.15,
    options: [
      { value: 1, label: '不会再买', explanation: '不愿再次为类似项目花钱' },
      { value: 2, label: '看情况', explanation: '是否再次消费仍需观察' },
      { value: 3, label: '愿意再买', explanation: '愿意再次为类似项目花钱' },
    ],
  },
]

export const CLASSIFICATION_THRESHOLDS = { high: 75, medium: 50 } as const

export const TRAINING_PROGRESS_REFERENCE = { activeStart: 0.8, activeTarget: 0.9 } as const
