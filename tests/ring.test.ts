import { describe, it, beforeEach, expect } from './deps.ts'

import Ring, { Entry } from '../ring.ts'
class Thing { constructor(public name: string) { } }

describe('Ring', () => {
  let ring: Ring<Thing>

  beforeEach(() => {
    ring = new Ring()
  })

  describe('with no entries', () => {
    it('#next always returns undefined', () => {
      expect(ring.next()).toBeUndefined()
      expect(ring.next()).toBeUndefined()
    })
  })

  describe('with one entry', () => {
    const thing = new Thing('aaa')
    let entry: Entry<Thing>

    beforeEach(() => {
      entry = ring.add(thing)
    })

    it('#next always returns that entry', () => {
      expect(ring.next()).toBe(thing)
      expect(ring.next()).toBe(thing)
    })

    describe('that is then removed', () => {
      beforeEach(() => {
        ring.remove(entry)
      })

      it('#next always returns undefined', () => {
        expect(ring.next()).toBeUndefined()
        expect(ring.next()).toBeUndefined()
      })
    })
  })

  describe('with multiple entries', () => {
    const thingA = new Thing('aaa')
    const thingB = new Thing('bbb')
    const thingC = new Thing('ccc')
    let entry: Entry<Thing>

    beforeEach(() => {
      ring.add(thingA)
      entry = ring.add(thingB)
      ring.add(thingC)
    })

    it('#next returns the entries sequentially in a loop', () => {
      expect(ring.next()).toBe(thingA)
      expect(ring.next()).toBe(thingB)
      expect(ring.next()).toBe(thingC)
      expect(ring.next()).toBe(thingA)
      expect(ring.next()).toBe(thingB)
      expect(ring.next()).toBe(thingC)
    })

    describe('and one is removed', () => {
      beforeEach(() => {
        ring.remove(entry)
      })

      it('#next returns the remaining entries sequentially in a loop', () => {
        expect(ring.next()).toBe(thingA)
        expect(ring.next()).toBe(thingC)
        expect(ring.next()).toBe(thingA)
        expect(ring.next()).toBe(thingC)
      })

      describe('and then the current entry is dropped', () => {
        beforeEach(() => {
          expect(ring.next()).toBe(thingA)
          ring.drop()
        })

        it('#next returns the subsequent entry', () => {
          expect(ring.next()).toBe(thingC)
          expect(ring.next()).toBe(thingC)
        })
      })
    })

    describe('and then each current entry is dropped', () => {
      beforeEach(() => {
        expect(ring.next()).toBe(thingA)
        ring.drop()
        expect(ring.next()).toBe(thingB)
        ring.drop()
        expect(ring.next()).toBe(thingC)
        ring.drop()
      })

      it('#next returns undefined', () => {
        expect(ring.next()).toBeUndefined()
        expect(ring.next()).toBeUndefined()
      })

      it('a subsequent #drop does nothing', () => {
        expect(() => ring.drop()).not.toThrow()
        expect(ring.next()).toBeUndefined()
        expect(() => ring.drop()).not.toThrow()
        expect(ring.next()).toBeUndefined()
      })

      describe('and an entry is re-added', () => {
        const thingD = new Thing('ddd')

        beforeEach(() => {
          ring.add(thingD)
        })

        it('#next returns that entry', () => {
          expect(ring.next()).toBe(thingD)
          expect(ring.next()).toBe(thingD)
        })
      })
    })
  })
})
