import {
  describe, it, beforeEach, expect,
  assertArrayIncludes,
} from './deps.ts'

import Peers from '../peers.ts'
import { PeerNode } from '../node.ts'

describe('Peers', () => {
  let peers: Peers

  beforeEach(() => {
    peers = new Peers()
  })

  describe('#add', () => {
    const identifier = 'xyz'
    const peer = new PeerNode(identifier, 'remote')
    let returnValue : unknown

    beforeEach(() => {
      returnValue = peers.add(peer)
    })

    it('returns itself (the Peers instance)', () => {
      expect(returnValue).toBe(peers)
    })

    it('keeps track of the peer node', () => {
      expect(peers.count).toBe(1)
      expect(peers.get(identifier)).toBe(peer)
      expect(peers.next()).toBe(peer)
      expect([...peers.actives()]).toEqual([peer])
    })
  })

  describe('with no peers', () => {
    it('#count is 0', () => {
      expect(peers.count).toBe(0)
    })

    it('#next returns null', () => {
      expect(peers.next()).toBeUndefined()
    })

    it('#actives returns an empty set', () => {
      expect(peers.actives()).toEqual([])
    })

    it('#digest returns an empty array', () => {
      expect(peers.digest()).toEqual([])
    })

    it('#randomActives returns an empty array', () => {
      expect(peers.randomActives(2)).toEqual([])
    })

    it('#randomInactive returns nothing', () => {
      expect(peers.randomInactive()).toBeUndefined()
    })

    it('#prune does nothing', () => {
      expect(() => { peers.prune() }).not.toThrow()
    })
  })

  describe('with peers', () => {
    const peer1 = new PeerNode('other1', 'remote1')
    const peer2 = new PeerNode('other2', 'remote2')
    const peer3 = new PeerNode('other3', 'remote3')

    beforeEach(() => {
      peers.add(peer1)
      peers.add(peer2)
      peers.add(peer3)
    })

    it('#count is the number of peers', () => {
      expect(peers.count).toBe(3)
    })

    describe('#get', () => {
      it('returns the PeerNode for the given id', () => {
        expect(peers.get('other3')).toBe(peer3)
        expect(peers.get('other1')).toBe(peer1)
      })

      it('returns undefined when there is no peer for the id', () => {
        expect(peers.get('nonexistent')).toBeUndefined()
      })
    })

    it('#next returns each peer sequentially in a loop', () => {
      expect(peers.next()).toBe(peer1)
      expect(peers.next()).toBe(peer2)
      expect(peers.next()).toBe(peer3)
      expect(peers.next()).toBe(peer1)
      expect(peers.next()).toBe(peer2)
      expect(peers.next()).toBe(peer3)
    })

    it('#actives returns a set of the peer nodes', () => {
      const actives = peers.actives()
      expect(actives).toBeInstanceOf(Set)
      expect(actives.size).toBe(3)
      assertArrayIncludes([...actives], [peer1, peer2, peer3])
    })

    it('#digest includes digest for all active peers', () => {
      assertArrayIncludes(
        peers.digest().map(d => d[0]),
        [ 'other1', 'other2', 'other3' ]
      )
    })

    it('#randomInactive returns nothing', () => {
      expect(peers.randomInactive()).toBeUndefined()
    })

    describe('#prune', () => {
      let returnValue: unknown

      beforeEach(() => {
        // ensure all peers appear to be active...
        peer1.apply(101, [])
        peer2.apply(102, [])
        peer3.apply(103, [])
        returnValue = peers.prune()
      })

      it('returns itself (the Peers instance)', () => {
        expect(returnValue).toBe(peers)
      })

      describe('with all active', () => {
        it('#count is the same', () => {
          expect(peers.count).toBe(3)
        })

        it('#actives is the same', () => {
          expect(peers.actives().size).toBe(3)
        })
      })

      describe('with one inactive', () => {
        beforeEach(() => {
          peer2.inactive()
          peers.prune()
        })

        it('#actives does not include inactive peer', () => {
          const actives = [...peers.actives()]
          expect(actives.length).toBe(2)
          assertArrayIncludes(actives, [peer1, peer3])
          expect(actives).not.toContain(peer2)
        })

        it('#digest does not include inactive peer', () => {
          const digests = peers.digest().map(id => id[0])
          assertArrayIncludes(digests, ['other1', 'other3'])
          expect(digests).not.toContain('other2')
        })

        it('#randomActives does not include inactive peer', () => {
          expect(peers.randomActives(10)).not.toContain(peer2)
        })

        it('#randomInactive returns the inactive peer', () => {
          expect(peers.randomInactive()).toBe(peer2)
        })

        describe('and discardable', () => {
          beforeEach(() => {
            peer2.discardable = () => true
            peers.prune()
          })

          it('removes the discardable, inactive peer', () => {
            expect(peers.count).toBe(2)
            expect(peers.get('other2')).toBeUndefined()
            expect(peers.next()).toBe(peer1)
            expect(peers.next()).toBe(peer3)
            expect(peers.next()).toBe(peer1)
            expect(peers.next()).toBe(peer3)
          })
        })
      })

      describe('with all inactive', () => {
        beforeEach(() => {
          peer1.inactive()
          peer2.inactive()
          peer3.inactive()
          peers.prune()
        })

        it('#actives is empty', () => {
          expect(peers.actives()).toEqual([])
        })

        it('#digest returns an empty array', () => {
          expect(peers.digest()).toEqual([])
        })

        it('#randomActives returns an empty array', () => {
          expect(peers.randomActives(2)).toEqual([])
        })

        it('#randomInactive returns a PeerNode', () => {
          expect(peers.randomInactive()).toBeInstanceOf(PeerNode)
        })
      })
    })
  })
})
