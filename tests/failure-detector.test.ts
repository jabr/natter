import {
  describe, it, beforeEach, afterEach, expect, FakeTime,
} from './deps.ts'

import FailureDetector from '../failure-detector.ts'

describe('failure-detector', () => {
  let time: FakeTime
  let detector: FailureDetector

  beforeEach(() => {
    time = new FakeTime()
    detector = new FailureDetector()
  })

  afterEach(() => {
    time.restore()
  })

  describe('#phi', () => {
    describe('with no variance', () => {
      it('is zero when no time has elapsed since last update', () => {
        expect(detector.phi).toBe(0)
      })

      it('increases as the time since the last update increases', () => {
        time.tick(500)
        expect(detector.phi).toBeCloseTo(0.5)
        time.tick(500)
        expect(detector.phi).toBeCloseTo(1.0)
        time.tick(1_000)
        expect(detector.phi).toBeCloseTo(2.0)
        time.tick(10_000)
        expect(detector.phi).toBeCloseTo(12.0)
      })
    })

    describe('with some variance', () => {
      beforeEach(() => {
        time.tick(2_000)
        detector.update()
      })

      it('is zero when no time has elapsed since last update', () => {
        expect(detector.phi).toBe(0)
      })

      it('increases more slowly as the time since the last update increases', () => {
        time.tick(500)
        expect(detector.phi).toBeCloseTo(0.2941176, 7)
        time.tick(500)
        expect(detector.phi).toBeCloseTo(0.5882353, 7)
        time.tick(1_000)
        expect(detector.phi).toBeCloseTo(1.1764706, 7)
        time.tick(10_000)
        expect(detector.phi).toBeCloseTo(7.0588235, 7)
      })
    })
  })
})
