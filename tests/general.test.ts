import { describe, it, beforeEach, assertEquals } from './deps.ts'
import { random } from './utils.ts'

describe('random', () => {
  describe('gaussian', () => {
    let value: number

    beforeEach(() => {
      value = random.gaussian()
    })

    it('returns a number', () => {
      assertEquals(typeof value, 'number')
    })
  })
})
