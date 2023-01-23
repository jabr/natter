import { Optional, Address, randomlyOccurs, randomInteger } from './common.ts'
import Peers from './peers.ts'
import { Node, SelfNode, PeerNode, Digest, Diff } from './node.ts'

type NodeDiff = [Digest, Diff[], Address?]

const HEARTBEAT_INTERVAL = 1000 // milliseconds
const SYNC_WITH_ROOT_FREQUENCY = 0.2
const SYNC_WITH_INACTIVE_FREQUENCY = 0.1
const SYNC_WITH_COUNT = 4

export default class Cluster {
  public node : SelfNode
  public peers : Peers = new Peers
  private interval : Optional<number>

  constructor(id: string, address: Address, public roots: Address[] = []) {
    const timestamp = Date.now().toString(36)
    const nonce = crypto.getRandomValues(new Uint16Array(1))[0].toString(16)
    const identifier = `${id}/${timestamp}:${nonce}`
    this.node = new SelfNode(identifier, address)
  }

  public start() {
    this.node.heartbeat()
    this.sync()
    this.interval = setInterval(() => {
      this.peers.prune()
      this.node.heartbeat()
      this.sync()
    }, HEARTBEAT_INTERVAL)
  }

  public stop() {
    if (this.interval) clearInterval(this.interval)
    this.interval = undefined
  }

  private sync() {
    // @todo: send(this.targets(), this.digest())
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
    const actives: Set<Node> = this.peers.activeSet()
    actives.add(this.node)
    for (const [ identifier, sequence ] of digest) {
      const node = this.nodeFor(identifier)
      if (node) {
        actives.delete(node)
        if (node.sequence < sequence) {
          if (this.node === node) {
            // we received a digest claiming to have a newer version of ourself. this should not happen.
            console.error(`received digest for ourself with a higher sequence (${identifier} @ ${sequence} > ${node.sequence})`)
            // @note: should we shutdown? something else?
            continue
          }
          requests.push([identifier, node.sequence])
        } else if (node.sequence > sequence) {
          diffs.push([node.digest, node.diff(sequence)])
        }
      } else {
        requests.push([identifier, 0])
      }
    }

    // add diffs for any active nodes we have that are not in the digest
    for (const node of actives) {
      diffs.push([node.digest, node.diff(0), node.address])
    }

    return [ requests, diffs ]
  }

  private processDiffs(diffs: NodeDiff[]) {
    for (const [ [identifier, sequence], updates, address ] of diffs) {
      let node = this.nodeFor(identifier)
      if (this.node === node) {
        // we received an update for ourself. this should not happen.
        console.error(`received diffs to update ourself (${identifier} @ ${sequence})`)
        // @note: should we shutdown? something else?
        continue
      }

      if (!node && address) node = this.peers.add(identifier, address)
      if (node) (node as PeerNode).apply(sequence, updates)
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

  private randomRoot() : Optional<Address> {
    return this.roots[randomInteger(this.roots.length)]
  }

  private targets() : Set<Address> {
    // if we have no peers yet, target the roots
    if (this.peers.count === 0) return new Set(this.roots)

    const sample = new Set<Address>
    // add the next node on peer ring
    const node = this.peers.next()
    if (node) sample.add(node.address)

    // sometimes, add a root
    if (randomlyOccurs(SYNC_WITH_ROOT_FREQUENCY)) {
      const address = this.randomRoot()
      if (address) sample.add(address)
    }

    // sometimes, add an inactive
    if (randomlyOccurs(SYNC_WITH_INACTIVE_FREQUENCY)) {
      const node = this.peers.randomInactive()
      if (node) sample.add(node.address)
    }

    // add random actives to fill
    const actives = this.peers.randomActives(SYNC_WITH_COUNT - sample.size)
    for (const node of actives) sample.add(node.address)

    return sample
  }
}
