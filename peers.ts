import { PeerNode, Address } from './node.ts'
import Ring, { Entry } from './ring.ts'

type Peer = [ PeerNode, Entry<PeerNode> ]
export default class Peers {
  private list : { [index: string] : Peer } = {}
  private ring : Ring<PeerNode> = new Ring

  get(identifier: string) : PeerNode|undefined {
    return this.list[identifier]?.[0]
  }

  add(identifier: string, address: Address) : PeerNode {
    const node = new PeerNode(identifier, address)
    this.list[identifier] = [ node, this.ring.add(node) ]
    return node
  }

  digest() {
    return Object.values(this.list)
      .filter(([node, _]) => node.active)
      .map(([node, _]) => [ node.identifier, node.sequence ])
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
