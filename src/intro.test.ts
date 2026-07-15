import { beforeEach, describe, expect, it } from 'vitest'
import { hasSeenIntro, markIntroSeen } from './intro'

describe('首次理念介绍', () => {
  beforeEach(() => localStorage.clear())

  it('第一次启动时尚未阅读', () => {
    expect(hasSeenIntro()).toBe(false)
  })

  it('作出选择后不再强制显示', () => {
    markIntroSeen()
    expect(hasSeenIntro()).toBe(true)
  })
})
