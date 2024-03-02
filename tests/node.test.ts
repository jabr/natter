import {
  describe, it, beforeEach, afterEach, expect, assert, FakeTime,
} from './deps.ts'

import { Node, PeerNode, SelfNode } from '../node.ts'

describe('Node', () => {
  class ConcreteNode extends Node { }
  let node: ConcreteNode

  beforeEach(() => {
    node = new ConcreteNode('a', 'a.local')
  })

  it('.identifier is set by constructor', () => {
    expect(node.identifier).toBe('a')
  })

  it('.address is set by constructor', () => {
    expect(node.address).toBe('a.local')
  })

  it('.sequence is a number', () => {
    expect(typeof node.sequence).toBe('number')
  })

  it('#get returns undefined for nonexistent keys', () => {
    expect(node.get('none')).toBeUndefined()
  })

  it('#diff returns an array', () => {
    expect(node.diff(0)).toBeInstanceOf(Array)
  })

  it('#discardable returns a boolean', () => {
    expect(typeof node.discardable()).toBe('boolean')
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
    assert(node instanceof Node, 'Expected object to be instance of Node')
  })

  describe('#get', () => {
    it('returns the current value for a key', () => {
      expect(node.get('aaa')).toBe('x')
      expect(node.get('bbb')).toBe('y')
      expect(node.get('ccc')).toBe('z')
    })
  })

  describe('#diff', () => {
    describe('when the sequence is 0', () => {
      it('returns all of the entries', () => {
        expect(node.diff(0)).toEqual([
          ["aaa", ["x", 1]],
          ['bbb', ['y', 3]],
          ['ccc', ['z', 5]],
        ])
      })
    })

    describe('when the sequence is in the middle of entries', () => {
      it('returns an newer entries', () => {
        expect(node.diff(3)).toEqual([['ccc', ['z', 5]]]);
      })
    })

    describe('when the sequence is greater than all entries', () => {
      it('returns an empty array', () => {
        expect(node.diff(Infinity)).toEqual([])
      })
    })
  })

  describe('#apply', () => {
    describe("when the sequence is not greater than the node's", () => {
      it('does not change the node', () => {
        node.apply(2, [['aaa', ['xyz', 2]]])
        expect(node.sequence).toBe(5)
        expect(node.get('aaa')).toBe('x')
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
        expect(node.sequence).toBe(8)
      })

      it('updates keys with changes we have not seen yet', () => {
        expect(node.get('ccc')).toBe('HHH')
      })

      it('does not update keys with out-of-date changes', () => {
        expect(node.get('bbb')).toBe('y')
      })
    })

    describe('with no detector', () => {
      beforeEach(() => {
        node.inactive()
        expect(node.phi).toBe(NaN)
      })

      it('creates a new detector', () => {
        node.apply(8, [])
        time.tick(500)
        expect(node.phi).toBeCloseTo(0.500, 3)
      })
    })

    describe('with a detector', () => {
      beforeEach(() => {
        expect(node.phi).not.toBe(NaN)
        expect(node.phi).toBe(0)
        time.tick(10_000)
      })

      it('updates the existing detector', () => {
        node.apply(8, [])
        time.tick(500)
        expect(node.phi).toBeCloseTo(0.068, 3)
      })
    })
  })

  describe('when new', () => {
    it('.active is true', () => {
      expect(node.active).toBe(true)
    })

    it('#discardable stays false indefinitely', () => {
      time.tick(100_000_000)
      expect(node.discardable()).toBe(false)
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
        expect(discardable).toBe(false)
      })

      it('causes #active to become false', () => {
        expect(node.active).toBe(false)
      })
    })

    describe('eventually', () => {
      beforeEach(() => {
        node.discardable()
        time.tick(100_000_000)
      })

      it('#discardable returns true', () => {
        expect(node.discardable()).toBe(true)
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
          expect(discardable).toBe(false)
        })

        it('#active is still true', () => {
          expect(node.active).toBe(true)
        })
      })

      it('#active is true', () => {
        expect(node.active).toBe(true)
      })
    })
  })

  describe('#inactive', () => {
    beforeEach(() => {
      node.inactive()
    })

    it('.active is false', () => {
      expect(node.active).toBe(false)
    })

    describe('#discardable', () => {
      it('is false initially', () => {
        expect(node.discardable()).toBe(false)
      })

      it('is true eventually', () => {
        time.tick(100_000_000)
        expect(node.discardable()).toBe(true)
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
    assert(node instanceof Node, 'Expected object to be instance of Node')
  })

  describe('#set', () => {
    beforeEach(() => {
      node.set('name', 'foo')
    })

    it('increments the sequence', () => {
      expect(node.sequence).toBe(1)
      node.set('name', 'bar')
      expect(node.sequence).toBe(2)
    })

    it('stores the value', () => {
      expect(node.get('name')).toBe('foo')
    })

    it('changes the diff against an earlier sequence', () => {
      expect(node.diff(0)).toEqual([['name', ['foo', 1]]])
      node.set('name', 'bar')
      expect(node.diff(0)).toEqual([['name', ['bar', 2]]])
    })

    it('does not change the diff againt the current sequence or later', () => {
      expect(node.diff(1)).toEqual([])
      expect(node.diff(9)).toEqual([])
    })
  })

  it('#discardable returns false', () => {
    expect(node.discardable()).toBe(false)
  })
})
