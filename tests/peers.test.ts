import {
  describe, it, beforeEach,
  assertStrictEquals, assertInstanceOf, assertArrayIncludes,
} from './deps.ts'

import Peers from '../peers.ts'
import { PeerNode } from '../node.ts'

describe('Peers', () => {
  let peers: Peers

  beforeEach(() => {
    peers = new Peers()
  })

  it('#count is 0', () => {
    assertStrictEquals(peers.count, 0)
  })

  it('#next returns null', () => {
    assertStrictEquals(peers.next(), undefined)
  })

  describe('with peers', () => {
    let peer1 : PeerNode
    let peer2 : PeerNode
    let peer3 : PeerNode

    beforeEach(() => {
      peer1 = peers.add('other1', 'localhost:10101')
      peer2 = peers.add('other2', 'localhost:10102')
      peer3 = peers.add('other3', 'localhost:10103')
    })

    it('as PeerNodes', () => {
      assertInstanceOf(peer1, PeerNode)
      assertInstanceOf(peer2, PeerNode)
      assertInstanceOf(peer3, PeerNode)
    })

    it('#count is the number of peers', () => {
      assertStrictEquals(peers.count, 3)
    })

    describe('#next', () => {
      it('returns each peer sequentially in a loop', () => {
        assertStrictEquals(peers.next(), peer1)
        assertStrictEquals(peers.next(), peer2)
        assertStrictEquals(peers.next(), peer3)
        assertStrictEquals(peers.next(), peer1)
        assertStrictEquals(peers.next(), peer2)
        assertStrictEquals(peers.next(), peer3)
      })
    })

    it('#active returns a set of the peer nodes', () => {
      assertArrayIncludes(
        [...peers.actives()],
        [peer1, peer2, peer3]
      )
    })

    describe('and one is inactive', () => {
      // @todo
      describe('and discardable', () => {
        // @todo
      })
    })

    describe('and all are inactive', () => {
      // @todo
    })
  })
})
