import { describe, it, beforeEach, expect } from './deps.ts'

import Queue from '../queue.ts'
class Thing { constructor(public name: string) { } }

describe('Queue', () => {
  let queue: Queue<Thing>

  const thingA = new Thing('aaa')
  const thingB = new Thing('bbb')
  const thingC = new Thing('ccc')

  beforeEach(() => {
    queue = new Queue()
  })

  describe('#push', () => {
    it('returns itself (the Queue instance)', () => {
      expect(queue.push(thingA)).toBe(queue)
    })
  })

  describe('when items are already queue', () => {
    beforeEach(() => {
      queue.push(thingA)
      queue.push(thingB)
      queue.push(thingC)
    })

    describe('#take', () => {
      it('returns the items one at a time', async () => {
        expect(await queue.take()).toBe(thingA)
        expect(await queue.take()).toBe(thingB)
        expect(await queue.take()).toBe(thingC)
      })
    })

    describe('[Symbol.asyncIterator]', () => {
      it('iterates over the items', async () => {
        const expected = [ thingA, thingB, thingC ]
        for await (const item of queue) {
          expect(item).toBe(expected.shift())
          if (queue.length <= 0) break
        }
      })
    })
  })

  describe('when no items are queued', () => {
    it('#take calls resolve in order when items are pushed', async () => {
      const p1 = queue.take()
      const r1 = p1.then(x => expect(x).toBe(thingB))
      const p2 = queue.take()
      const r2 = p2.then(x => expect(x).toBe(thingA))
      queue.push(thingB)
      queue.push(thingA)
      await r1
      await r2
    })
  })
})
