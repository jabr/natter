import { describe, it, beforeEach, assertStrictEquals } from './deps.ts'

import Peers from '../peers.ts'

describe('Peers', () => {
  let peers: Peers

  beforeEach(() => {
    peers = new Peers()
  })

  it('#count is 0', () => {
    assertStrictEquals(peers.count, 0)
  })
})
