import { Optional, Address, Identifier, randomInteger, shuffle } from './common.ts'
import { Node, PeerNode, Digest } from './node.ts'
import Ring, { Entry } from './ring.ts'

type Peer = [PeerNode, Entry<PeerNode>]
export default class Peers {
  private list: { [index: Identifier]: Peer } = {}
  private active: PeerNode[] = []
  private inactive: PeerNode[] = []
  private ring: Ring<PeerNode> = new Ring

  get count() { return Object.keys(this.list).length }
  next(): Optional<PeerNode> { return this.ring.next() }

  get(identifier: Identifier): Optional<PeerNode> {
    return this.list[identifier]?.[0]
  }

  add(identifier: Identifier, address: Address): PeerNode {
    const node = new PeerNode(identifier, address)
    this.list[identifier] = [node, this.ring.add(node)]
    this.active.push(node)
    return node
  }

  digest(): Digest[] {
    return this.active.map(node => node.digest)
  }

  prune() {
    this.active = this.inactive = []
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
