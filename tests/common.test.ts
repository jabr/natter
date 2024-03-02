import {
  describe, it, beforeEach,
  assertEquals, assertStrictEquals, assertArrayIncludes,
} from './deps.ts'
import { randomGaussian, shuffle } from '../common.ts'

describe('randomGaussian', () => {
  let value: number

  beforeEach(() => {
    value = randomGaussian()
  })

  it('returns a number', () => {
    assertEquals(typeof value, 'number')
  })

  describe('with a mean and standard deviation', () => {
    beforeEach(() => {
      value = randomGaussian(100, 100)
    })

    it('returns a number', () => {
      assertEquals(typeof value, 'number')
    })
  })
})

describe('shuffle', () => {
  const array = [
    'aaa',
    'ccc',
    'bbb',
  ]

  it('returns the shuffled array', () => {
    const shuffled = shuffle(array)
    assertStrictEquals(array, shuffled)
    assertArrayIncludes(array, ['aaa', 'bbb', 'ccc'])
    console.log(array)
  })
})
