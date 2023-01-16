import { Optional, Address } from './common.ts'
import { Node, PeerNode, Digest } from './node.ts'
import Ring, { Entry } from './ring.ts'

type Peer = [ PeerNode, Entry<PeerNode> ]
export default class Peers {
  private list : { [index: string] : Peer } = {}
  private ring : Ring<PeerNode> = new Ring

  get count() { return Object.keys(this.list).length }
  next() : Optional<PeerNode> { return this.ring.next() }

  get(identifier: string) : Optional<PeerNode> {
    return this.list[identifier]?.[0]
  }

  add(identifier: string, address: Address) : PeerNode {
    const node = new PeerNode(identifier, address)
    this.list[identifier] = [ node, this.ring.add(node) ]
    return node
  }

  partition() : { active: PeerNode[], inactive: PeerNode[] } {
    return Object.values(this.list).reduce((parts, [node, _]) => {
      parts[node.active ? 'active' : 'inactive'].push(node)
      return parts
    }, { active: [] as PeerNode[], inactive: [] as PeerNode[] })
  }

  digest() : Digest[] {
    return this.partition().active.map(node => node.digest)
  }

  prune() {
    for (const peer of Object.values(this.list)) {
      const [ node, ringEntry ] = peer
      if (node.discardable()) {
        this.ring.remove(ringEntry)
        delete this.list[node.identifier]
      }
    }
  }
}
