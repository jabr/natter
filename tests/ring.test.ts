import { describe, it, beforeEach, assertStrictEquals } from './deps.ts'

import Ring, { Entry } from '../ring.ts'
class Thing { constructor(public name: string) { } }

describe('Ring', () => {
  let ring: Ring<Thing>

  beforeEach(() => {
    ring = new Ring()
  })

  describe('with no entries', () => {
    it('#next always returns undefined', () => {
      assertStrictEquals(ring.next(), undefined)
      assertStrictEquals(ring.next(), undefined)
    })
  })

  describe('with one entry', () => {
    let thing: Thing
    let entry: Entry<Thing>

    beforeEach(() => {
      thing = new Thing('aaa')
      entry = ring.add(thing)
    })

    it('#next always returns that entry', () => {
      assertStrictEquals(ring.next(), thing)
      assertStrictEquals(ring.next(), thing)
    })

    describe('that is then removed', () => {
      beforeEach(() => {
        ring.remove(entry)
      })

      it('#next always returns undefined', () => {
        assertStrictEquals(ring.next(), undefined)
        assertStrictEquals(ring.next(), undefined)
      })
    })
  })
})
