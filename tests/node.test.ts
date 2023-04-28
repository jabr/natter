import {
  describe, it, beforeEach,
  assert, assertInstanceOf, assertEquals, assertStrictEquals
} from './deps.ts'

import { Node, PeerNode, SelfNode } from '../node.ts'

describe('Node', () => {
  class ConcreteNode extends Node {}
  let node : ConcreteNode

  beforeEach(() => {
    node = new ConcreteNode('a', 'a.local')
  })

  it('#identifier is set by constructor', () => {
    assertEquals(node.identifier, 'a')
  })

  it('#address is set by constructor', () => {
    assertEquals(node.address, 'a.local')
  })

  it('#sequence is a number', () => {
    assertEquals(typeof node.sequence, 'number')
  })

  it('#get returns undefined for nonexistent keys', () => {
    assertStrictEquals(node.get('none'), undefined)
  })

  it('#diff returns an array', () => {
    assertInstanceOf(node.diff(0), Array)
  })

  it ('#discardable returns false', () => {
    assertStrictEquals(node.discardable(), false)
  })
})

describe('PeerNode', () => {
  let node : PeerNode

  beforeEach(() => {
    node = new PeerNode('b', 'b.local')
  })

  it('is a subclass of Node', () => {
    assert(node instanceof Node, 'not an instance of Node')
  })
})

describe('SelfNode', () => {
  let node : SelfNode

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
  })
})
