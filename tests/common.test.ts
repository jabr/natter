import {
  describe, it, beforeEach, expect, assertArrayIncludes,
} from './deps.ts'

import {
  randomlyOccurs, randomInteger, randomGaussian, secureRandomUint16, shuffle,
} from '../common.ts'

describe('randomlyOccurs', () => {
  it('returns a boolean', () => {
    expect(typeof randomlyOccurs(0.5)).toBe('boolean')
  })
})

describe('randomInteger', () => {
  const bound = 3
  let value: number

  beforeEach(() => {
    value = randomInteger(bound)
  })

  it('returns an integer', () => {
    expect(typeof value).toBe('number')
    expect(Number.isInteger(value)).toBe(true)
  })

  it('returns an integer in range [0, bound-1]', () => {
    expect(value).toBeGreaterThanOrEqual(0)
    expect(value).toBeLessThanOrEqual(bound-1)
  })
})

describe('randomGaussian', () => {
  let value: number

  beforeEach(() => {
    value = randomGaussian()
  })

  it('returns a number', () => {
    expect(typeof value).toBe('number')
  })

  describe('with a mean and standard deviation', () => {
    beforeEach(() => {
      value = randomGaussian(100, 100)
    })

    it('returns a number', () => {
      expect(typeof value).toBe('number')
    })
  })
})

describe('secureRandomUint16', () => {
  let value: number

  beforeEach(() => {
    value = secureRandomUint16()
  })

  it('returns an integer', () => {
    expect(typeof value).toBe('number')
    expect(Number.isInteger(value)).toBe(true)
  })

  it('returns an integer in range [0, 65535]', () => {
    expect(value).toBeGreaterThanOrEqual(0)
    expect(value).toBeLessThanOrEqual(65535)
  })
})

describe('shuffle<T>', () => {
  const array = [
    'aaa',
    'ccc',
    'bbb',
  ]

  it('returns the shuffled array', () => {
    const shuffled = shuffle<string>(array)
    expect(array).toBe(shuffled)
    assertArrayIncludes(array, ['aaa', 'bbb', 'ccc'])
  })
})
