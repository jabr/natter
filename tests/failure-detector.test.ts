import {
  describe, it, beforeEach, afterEach, FakeTime,
  assertStrictEquals, assertAlmostEquals,
} from './deps.ts'

import FailureDetector from '../failure-detector.ts'

describe('failure-detector', () => {
  let time : FakeTime
  let detector : FailureDetector

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
        assertStrictEquals(detector.phi, 0)
      })

      it('increases as the time since the last update increases', () => {
        time.tick(500)
        assertStrictEquals(detector.phi, 0.5)
        time.tick(500)
        assertStrictEquals(detector.phi, 1.0)
        time.tick(1_000)
        assertStrictEquals(detector.phi, 2.0)
        time.tick(10_000)
        assertStrictEquals(detector.phi, 12.0)
      })
    })

    describe('with some variance', () => {
      beforeEach(() => {
        time.tick(2_000)
        detector.update()
      })

      it('is zero when no time has elapsed since last update', () => {
        assertStrictEquals(detector.phi, 0)
      })

      it('increases more slowly as the time since the last update increases', () => {
        time.tick(500)
        assertAlmostEquals(detector.phi, 0.2941176)
        time.tick(500)
        assertAlmostEquals(detector.phi, 0.5882353)
        time.tick(1_000)
        assertAlmostEquals(detector.phi, 1.1764706)
        time.tick(10_000)
        assertAlmostEquals(detector.phi, 7.0588235)
      })
    })
  })
})
