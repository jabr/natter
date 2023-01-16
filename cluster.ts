import { Address } from './common.ts'
import Peers from './peers.ts'
import { SelfNode } from './node.ts'

export default class Cluster {
  public node : SelfNode
  public roots : Set<Address>
  public peers : Peers = new Peers

  constructor(id: string, address: Address, roots: Address[] = []) {
    const timestamp = Date.now().toString(36)
    const nonce = crypto.getRandomValues(new Uint16Array(1))[0].toString(16)
    const  identifier = `${id}/${timestamp}:${nonce}`
    this.node = new SelfNode(identifier, address)
    this.roots = new Set<Address>(roots)
  }

  private digest() {
    return [ this.node.digest, ...this.peers.digest() ]
  }

  private targets() : Set<Address> {
    // if we have no peers yet, target the roots
    if (this.peers.count === 0) return this.roots

    const sample = new Set<Address>
    // add the next node on peer ring
    let node = this.peers.next()
    if (node) sample.add(node.address)
    // @todo
    // - sometimes, add a root
    const nodes = this.peers.partition()
    // - sometimes, add an inactive
    // - add random actives to fill
    node = nodes.active[0]

    return sample
  }
}
