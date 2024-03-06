import { Optional, Address, Identifier, randomInteger, shuffle } from './common.ts'
import { Node, PeerNode, Digest } from './node.ts'
import Ring, { Entry } from './ring.ts'

type Peer = [PeerNode, Entry<PeerNode>]
export default class Peers {
  public list: { [index: Identifier]: Peer } = {} // @todo: make private
  private active: PeerNode[] = []
  private inactive: PeerNode[] = []
  private ring: Ring<PeerNode> = new Ring

  get count() { return Object.keys(this.list).length }
  next(): Optional<PeerNode> { return this.ring.next() }

  get(identifier: Identifier): Optional<PeerNode> {
    return this.list[identifier]?.[0]
  }

  add(node: PeerNode) {
    this.list[node.identifier] = [node, this.ring.add(node)]
    this.active.push(node)
    return this
  }

  digest(): Digest[] {
    return this.active.map(node => node.digest)
  }

  prune() {
    this.active = []
    this.inactive = []
    for (const peer of Object.values(this.list)) {
      const [node, ringEntry] = peer
      if (node.discardable()) {
        this.ring.remove(ringEntry)
        delete this.list[node.identifier]
      } else {
        if (node.active) this.active.push(node)
        else this.inactive.push(node)
      }
    }
    shuffle(this.active)
    return this
  }

  actives(): Set<Node> {
    return new Set(this.active)
  }

  randomActives(count: number): PeerNode[] {
    return this.active.slice(0, Math.max(0, count))
  }

  randomInactive(): Optional<PeerNode> {
    return this.inactive[randomInteger(this.inactive.length)]
  }
}
