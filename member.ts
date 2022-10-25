const DEFAULT_HEARTBEAT_INTERVAL = 1000

import Ring, { Entry } from "./ring.ts"

export type Address = string
export type Data = { e: string, i: bigint }
export interface Transport {
  send(to: Address, from: Address, data: Data): void
  recv(to: Address) : AsyncGenerator<[Address, Data]>
}

enum Condition { joining, live, suspect, dead, exiting }
type State = { c: Condition, i: bigint,  t: number, r: Entry<Address> }

export default class Member {
  private iteration = 0n
  private peers = new Map<Address, State>
  private ring = new Ring<Address>
  private address : Address
  private interval = 0

  constructor(
    private transport: Transport,
    private seeds: Address[],
    private options: { address?: Address } = {}
  ) {
    this.address = this.options.address ?? crypto.randomUUID()
  }

  async start() {
    for await (const [from, data] of this.transport.recv(this.address)) this.process(from, data)
    this.seeds.forEach(seed => {
      this.transport.send(seed, this.address, { e: 'join', i: 0n })
    })
    this.interval = setInterval(this.heartbeat.bind(this), DEFAULT_HEARTBEAT_INTERVAL)
  }

  stop() {
    // @todo: send leaving message
    clearInterval(this.interval)
  }

  process(from: Address, data: Data) {
    if (data.e === 'ping') {
        if (data.i > this.iteration) this.iteration = data.i + 1n
        this.transport.send(from, this.address, { e: 'ack', i: this.iteration })
        return
    }

    if (data.e === 'join') {
      this.joined(from)
      // @todo: add to pending gossip? any additional setup?
      return
    }

    const state = this.peers.get(from)
    // unknown peer?
    if (state === undefined) return // @todo: anything else to do here?

    switch (data.e) {
      case 'ack': {
        // @todo: add to pending gossip if condition changes?
        state.c = Condition.live
      } break
      case 'gossip': {
        // @todo
      } break
      default: {
        // @todo: log?
      } break
    }
  }

  heartbeat() {
    // @todo: handle any expiring pings, suspicions, etc
    // pings
    let count = Math.ceil(Math.log(this.peers.size + 1))
    while (count-- > 0) {
      const peer = this.ring.next()
      if (peer === undefined) continue
      const status = this.peers.get(peer)
      if (status === undefined) {
        // the ring had a peer address that we're not tracking, which should never happen.
        // @todo: just log or also purge peer from ring?
        continue
      }
      // @todo: skip peers that are exiting
      status.t = Date.now()
      this.transport.send(peer, this.address, { e: 'ping', i: status.i })
    }
  }

  joined(peer : Address) {
    const state = {
      c: Condition.joining,
      i: 0n,
      t: 0,
      r: this.ring.add(peer),
    } as State
    this.peers.set(peer, state)
  }

  dropped(peer : Address) {
    const state = this.peers.get(peer)
    this.peers.delete(peer)
    if (state !== undefined) this.ring.remove(state.r)
  }
}
