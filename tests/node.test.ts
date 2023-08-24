import {
  describe, it, beforeEach, afterEach, FakeTime,
  assert, assertInstanceOf, assertEquals, assertStrictEquals
} from './deps.ts'

import { Node, PeerNode, SelfNode } from '../node.ts'

describe('Node', () => {
  class ConcreteNode extends Node { }
  let node: ConcreteNode

  beforeEach(() => {
    node = new ConcreteNode('a', 'a.local')
  })

  it('.identifier is set by constructor', () => {
    assertEquals(node.identifier, 'a')
  })

  it('.address is set by constructor', () => {
    assertEquals(node.address, 'a.local')
  })

  it('.sequence is a number', () => {
    assertEquals(typeof node.sequence, 'number')
  })

  it('#get returns undefined for nonexistent keys', () => {
    assertStrictEquals(node.get('none'), undefined)
  })

  it('#diff returns an array', () => {
    assertInstanceOf(node.diff(0), Array)
  })

  it('#discardable returns a boolean', () => {
    assertEquals(typeof node.discardable(), 'boolean')
  })
})

describe('PeerNode', () => {
  let node: PeerNode
  let time: FakeTime

  beforeEach(() => {
    time = new FakeTime()
    node = new PeerNode('b', 'b.local')
    node.apply(5, [
      ['aaa', ['x', 1]],
      ['bbb', ['y', 3]],
      ['ccc', ['z', 5]],
    ])
  })

  afterEach(() => {
    time.restore()
  })

  it('is a subclass of Node', () => {
    assert(node instanceof Node, 'not an instance of Node')
  })

  describe('#get', () => {
    it('returns the current value for a key', () => {
      assertEquals(node.get('aaa'), 'x')
      assertEquals(node.get('bbb'), 'y')
      assertEquals(node.get('ccc'), 'z')
    })
  })

  describe('#diff', () => {
    describe('when the sequence is 0', () => {
      it('returns all of the entries', () => {
        assertEquals(node.diff(0), [
          ["aaa", ["x", 1]],
          ['bbb', ['y', 3]],
          ['ccc', ['z', 5]],
        ])
      })
    })

    describe('when the sequence is in the middle of entries', () => {
      it('returns an newer entries', () => {
        assertEquals(node.diff(3), [['ccc', ['z', 5]]]);
      })
    })

    describe('when the sequence is greater than all entries', () => {
      it('returns an empty array', () => {
        assertEquals(node.diff(Infinity), [])
      })
    })
  })

  describe('#apply', () => {
    describe("when the sequence is not greater than the node's", () => {
      it('does not change the node', () => {
        node.apply(2, [['aaa', ['xyz', 2]]])
        assertEquals(node.get('aaa'), 'x')
      })
    })

    describe('with a newer sequence', () => {
      beforeEach(() => {
        node.apply(8, [
          ['bbb', ['xyz', 2]],
          ['ccc', ['HHH', 7]],
        ])
      })

      it("updates the node's current sequence", () => {
        assertEquals(node.sequence, 8)
      })

      it('updates keys with changes we have not seen yet', () => {
        assertEquals(node.get('ccc'), 'HHH')
      })

      it('does not update keys with out-of-date changes', () => {
        assertEquals(node.get('bbb'), 'y')
      })
    })

    describe('with no detector') // @todo
    describe('with a dector') // @todo
  })

  describe('when new', () => {
    it('.active is true', () => {
      assertStrictEquals(node.active, true)
    })
  })

  describe('after a period of no activity', () => {
    beforeEach(() => {
      time.tick(30_000)
    })

    describe('the first call to #discardable', () => {
      let discardable: boolean

      beforeEach(() => {
        discardable = node.discardable()
      })

      it('returns false', () => {
        assertStrictEquals(discardable, false)
      })

      it('causes #active to become false', () => {
        assertStrictEquals(node.active, false)
      })
    })

    describe('eventually', () => {
      beforeEach(() => {
        node.discardable()
        time.tick(100_000_000)
      })

      it('#discardable returns true', () => {
        assertStrictEquals(node.discardable(), true)
      })
    })

    describe('then activity resumes', () => {
      beforeEach(() => {
        node.apply(6, [])
      })

      describe('#discardable', () => {
        let discardable: boolean

        beforeEach(() => {
          discardable = node.discardable()
        })

        it('returns false', () => {
          assertStrictEquals(discardable, false)
        })

        it('#active is still true', () => {
          assertStrictEquals(node.active, true)
        })
      })

      it('#active is true', () => {
        assertStrictEquals(node.active, true)
      })
    })
  })
})

describe('SelfNode', () => {
  let node: SelfNode

  beforeEach(() => {
    node = new SelfNode('c', 'c.local')
  })

  it('is a subclass of Node', () => {
    assert(node instanceof Node, 'not an instance of Node')
  })

  describe('#set', () => {
    beforeEach(() => {
      node.set('name', 'foo')
    })

    it('increments the sequence', () => {
      assertEquals(node.sequence, 1)
      node.set('name', 'bar')
      assertEquals(node.sequence, 2)
    })

    it('stores the value', () => {
      assertEquals(node.get('name'), 'foo')
    })

    it('changes the diff against an earlier sequence', () => {
      assertEquals(node.diff(0), [['name', ['foo', 1]]])
    })

    it('does not change the diff againt the current sequence', () => {
      assertEquals(node.diff(Infinity), [])
    })
  })

  it('#discardable returns false', () => {
    assertStrictEquals(node.discardable(), false)
  })
})
