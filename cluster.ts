import { Optional, Address } from './common.ts'
import Peers from './peers.ts'
import { Node, SelfNode, Digest, Diff } from './node.ts'

type NodeDiff = [Digest, Diff[], Address?]

export default class Cluster {
  public node : SelfNode
  public roots : Set<Address>
  public peers : Peers = new Peers

  constructor(id: string, address: Address, roots: Address[] = []) {
    const timestamp = Date.now().toString(36)
    const nonce = crypto.getRandomValues(new Uint16Array(1))[0].toString(16)
    const identifier = `${id}/${timestamp}:${nonce}`
    this.node = new SelfNode(identifier, address)
    this.roots = new Set<Address>(roots)
  }

  private digest() {
    return [ this.node.digest, ...this.peers.digest() ]
  }

  private nodeFor(identifier: string) : Optional<Node> {
    if (identifier === this.node.identifier) return this.node
    return this.peers.get(identifier)
  }

  private processDigest(digest: Digest[]) {
    const requests: Digest[] = []
    const diffs: NodeDiff[] = []
    for (const [ identifier, sequence ] of digest) {
      const node = this.nodeFor(identifier)
      if (node) {
        if (node.sequence < sequence) {
          // @todo: skip if this is our own node? error?
          requests.push([identifier, node.sequence])
        } else if (node.sequence > sequence) {
          diffs.push([node.digest, node.diff(sequence)])
        }
      } else {
        requests.push([identifier, 0])
      }
    }
    // @todo: add diffs for any active nodes we have that are not in the digest
    // -- diffs.push([n.identifier, n.sequence, n.diff(0), n.address])
    return [ requests, diffs ]
  }

  private processDiffs(diffs: NodeDiff[]) {
    for (const [ [identifier, sequence], updates, address ] of diffs) {
      // @todo: skip if this is our own node? error?
      let node = this.peers.get(identifier)
      if (!node && address) node = this.peers.add(identifier, address)
      if (node) node.apply(sequence, updates)
    }
  }

  private processRequests(requests: Digest[]) : NodeDiff[] {
    const diffs: NodeDiff[] = []
    for (const [identifier, sequence] of requests) {
      const node = this.nodeFor(identifier)
      if (node && node.sequence > sequence) {
        const diff: NodeDiff = [node.digest, node.diff(sequence)]
        if (sequence === 0) diff.push(node.address)
        diffs.push(diff)
      }
    }
    return diffs
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
