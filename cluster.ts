import {
  Optional, Address, Identifier, Key, Value,
  randomlyOccurs, randomInteger, secureRandomUint16
} from './common.ts'
import Peers from './peers.ts'
import { Node, SelfNode, PeerNode, Digest, Diff } from './node.ts'
import { Transport, Message, MessageType } from './transport.ts'

type NodeDiff = [Digest, Diff[], Address?]

const HEARTBEAT_INTERVAL = 1000 // milliseconds
const HEARTBEAT_KEY = '\x01h' as Key
const SYNC_WITH_ROOT_FREQUENCY = 0.2
const SYNC_WITH_INACTIVE_FREQUENCY = 0.1
const SYNC_WITH_COUNT = 4

export default class Cluster {
  public node: SelfNode // @todo: make private
  public peers: Peers = new Peers // @todo: make private
  private interval: Optional<number>

  constructor(private transport: Transport, id: string) {
    const timestamp = Date.now().toString(36)
    const nonce = secureRandomUint16().toString(16).padStart(4, '0')
    const identifier = `${id}/${timestamp}:${nonce}`
    this.node = new SelfNode(identifier as Identifier, this.transport.local())
  }

  public async start() {
    for await (const [from, data] of this.transport.recv()) {
      this.process(from, data)
    }

    this.define(HEARTBEAT_KEY, Date.now())
    this.interval = setInterval(() => {
      this.peers.prune()
      this.define(HEARTBEAT_KEY, Date.now())
    }, HEARTBEAT_INTERVAL)
  }

  public stop() {
    this.transport.stop()
    if (this.interval) clearInterval(this.interval)
    this.interval = undefined
  }

  public define(key: Key, value: Value) {
    this.node.set(key, value)
    if (this.interval) this.sync()
  }

  private sync() {
    const message: Message = [MessageType.SYN, this.digest(), []]
    for (const target of this.targets()) this.transport.send(target, message)
  }

  private process(from: Address, [type, digests, diffs]: Message): void {
    let requests: Digest[] = []
    let responses: NodeDiff[] = []

    if (type === MessageType.SYN) {
      [requests, responses] = this.processDigest(digests)
    } else if (type === MessageType.ACK) {
      this.processDiffs(diffs)
      responses = this.processRequests(digests)
    } else {
      console.error(`unknown message type: ${type}`)
    }

    if (requests.length > 0 || responses.length > 0) {
      this.transport.send(from, [MessageType.ACK, requests, responses])
    }
  }

  private digest() {
    return [this.node.digest, ...this.peers.digest()]
  }

  private nodeFor(identifier: Identifier): Optional<Node> {
    if (identifier === this.node.identifier) return this.node
    return this.peers.get(identifier)
  }

  private processDigest(digest: Digest[]): [Digest[], NodeDiff[]] {
    const requests: Digest[] = []
    const diffs: NodeDiff[] = []
    const actives = this.peers.actives()
    actives.add(this.node)
    for (const [identifier, sequence] of digest) {
      const node = this.nodeFor(identifier)
      if (!node) {
        // unknown node, so request all info on it.
        requests.push([identifier, 0])
        continue
      }

      actives.delete(node)
      if (node.sequence < sequence) { // peer's info is newer?
        if (this.node === node) {
          // we received a digest claiming to have a newer version of ourself. this should not happen.
          console.error(`received digest for ourself with a higher sequence (${identifier} @ ${sequence} > ${node.sequence})`)
          // @note: should we shutdown? something else? jump sequence and send update with current state?
          continue
        }
        requests.push([identifier, node.sequence])
      } else if (node.sequence > sequence) { // peer's info is older
        diffs.push([node.digest, node.diff(sequence)])
      }
    }

    // add diffs for any active nodes we have that are not in the digest
    for (const node of actives) {
      diffs.push([node.digest, node.diff(0), node.address])
    }

    return [requests, diffs]
  }

  private processDiffs(diffs: NodeDiff[]) {
    for (const [[identifier, sequence], updates, address] of diffs) {
      let node = this.nodeFor(identifier)
      if (this.node === node) {
        // we received an update for ourself. this should not happen.
        console.error(`received diffs to update ourself (${identifier} @ ${sequence})`)
        // @note: should we shutdown? something else?
        continue
      }

      if (!node && address) {
        this.peers.add(node = new PeerNode(identifier, address))
      }

      if (node) {
        (node as PeerNode).apply(sequence, updates)
      }
    }
  }

  private processRequests(requests: Digest[]): NodeDiff[] {
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

  private randomRoot(): Optional<Address> {
    const roots = this.transport.roots()
    return roots[randomInteger(roots.length)]
  }

  private targets(): Set<Address> {
    // if we have no peers yet, target the roots
    if (this.peers.count === 0) return new Set(this.transport.roots())

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
