import {
  describe, it, beforeEach, afterEach, expect, FakeTime
} from './deps.ts'

import Cluster from '../cluster.ts'
import {
  TransportConfig, ConfiguredTransport,
  Address, Message, MessageType,
} from '../transport.ts'
import Queue from '../queue.ts'

type AM = [Address, Message]
type Packet = {
  state: string,
  at: number,
  from: Address,
  to: Address,
  message: Message
}

class Transport extends ConfiguredTransport {
  public dropping = false
  public messages = new Queue<AM>

  constructor(private network: Network, config: TransportConfig) {
    super(config)
  }

  send(to: Address, data: Message) {
    const record: Packet = {
      state: 'unknown',
      at: Date.now(),
      from: this.local(),
      to,
      message: data,
    }
    this.network.packets.push(record)

    if (this.dropping) {
      record.state = 'not-sent'
      return
    }

    const transport = this.network.transports.get(to)
    if (transport) {
      if (transport.dropping) {
        record.state = 'not-delivered'
        return
      }

      transport.messages.push([record.from, record.message])
      record.state = 'sent'
    }
  }

  recv(): AsyncGenerator<[Address, Message]> {
    return this.messages[Symbol.asyncIterator]()
  }

  stop() { this.network.transports.delete(this.local()) }
}

class Network {
  public packets: Packet[] = []
  public transports = new Map<Address, Transport>

  constructor(public roots: Address[]) {}

  connect(local: Address) {
    const roots = this.roots.filter(address => address !== local)
    const transport = new Transport(this, { local, roots })
    this.transports.set(local, transport)
    return transport
  }
}

describe('Cluster', () => {
  let time: FakeTime
  let network: Network
  let cluster: Cluster

  function assertPacketCount(count: number) {
    expect(network.packets.length).toBe(count)
  }

  const { SYN, ACK } = MessageType
  function assertPacket(
    index: number, type: MessageType,
    from: Address, to: Address,
    state?: string
  ) {
    const packet = network.packets.at(index)!
    const [ messageType, ...message ] = packet.message
    expect(messageType).toBe(type)
    expect(packet.from).toBe(from)
    expect(packet.to).toBe(to)
    if (state) expect(packet.state).toEqual(state)
    return message
  }

  beforeEach(() => {
    time = new FakeTime()
    network = new Network(['m.local', 'a.local'])
    cluster = new Cluster(network.connect('m.local'), 'test-cluster', 'm')
  })

  afterEach(() => {
    cluster.stop()
    time.restore()
  })

  it('basic setup', () => {
    expect(cluster.name).toBe('test-cluster/m')
    expect(cluster.identifier).toMatch(/^test-cluster\/m:/)
    expect(cluster.sequence).toBe(0)
    expect(cluster.peerCount).toBe(0)
  })

  describe('#start', () => {
    beforeEach(() => {
      cluster.start()
    })

    it('increments its sequence', () => {
      expect(cluster.sequence).toBe(1)
    })

    it('immediately sends a heartbeat to roots', () => {
      assertPacketCount(1)
      const p = assertPacket(-1, SYN, 'm.local', 'a.local', 'unknown')
      expect(p[0][0][0]).toEqual(cluster.identifier)
    })

    it('schedules a periodic heartbest', () => {
      time.tick(1000)
      assertPacketCount(2)
      assertPacket(-1, SYN, 'm.local', 'a.local')
      time.tick(1000)
      assertPacketCount(3)
      const p = assertPacket(-1, SYN, 'm.local', 'a.local', 'unknown')
      expect(p[0][0][0]).toEqual(cluster.identifier)
    })
  })

  describe('with one non-root peer', () => {
    let other: Cluster

    beforeEach(() => {
      cluster.start()
      time.tick(250)
      other = new Cluster(network.connect('o.local'), 'test-cluster', 'o')
      other.start()
    })

    afterEach(() => {
      cluster.stop()
    })

    it('the peer pings roots and syncs with the main root node', async () => {
      assertPacketCount(3)
      assertPacket(-2, SYN, 'o.local', 'm.local', 'sent')
      assertPacket(-1, SYN, 'o.local', 'a.local', 'unknown')
      await time.delay(0)
      assertPacketCount(5)
      let p = assertPacket(-2, ACK, 'm.local', 'o.local', 'sent')
      // main requests all values about the other node
      expect(p[0][0]).toEqual([other.identifier, 0])
      // main sends all of its values to the other node
      expect(p[1][0][0][0]).toEqual(cluster.identifier)
      expect(p[1][0][1][0][0]).toEqual('\x01h') // heartbeat key
      expect(p[1][0][2]).toEqual('m.local')
      p = assertPacket(-1, ACK, 'o.local', 'm.local', 'sent')
      // other requests info on no additional nodes
      expect(p[0]).toEqual([])
      // other sends all of its values to the main node
      expect(p[1][0][0][0]).toEqual(other.identifier)
      expect(p[1][0][1][0][0]).toEqual('\x01h') // heartbeat key
      expect(p[1][0][2]).toEqual('o.local')
    })

    it('inspect', async () => {
      await time.delay(0)
      console.log(cluster.node)
      console.log(cluster.peers.list)
    })
  })

  describe('#define') // @todo
})
