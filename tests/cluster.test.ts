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
class TestTransport extends ConfiguredTransport {
  public dropping = false
  public messages = new Queue<AM>

  constructor(private network: TestNetwork, config: TransportConfig) {
    super(config)
  }

  send(to: Address, data: Message) {
    const record = {
      state: 'unknown',
      at: Date.now(),
      from: this.local(),
      to,
      message: data,
    }
    console.log(record)
    this.network.messages.push(record)

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

class TestNetwork {
  public messages: {
    state: string,
    at: number,
    from: Address,
    to: Address,
    message: Message
  }[] = []
  public transports = new Map<Address, TestTransport>

  constructor(public roots: Address[]) {}

  connect(local: Address) {
    const roots = this.roots.filter(address => address !== local)
    const transport = new TestTransport(this, { local, roots })
    this.transports.set(local, transport)
    return transport
  }
}

describe('Cluster', () => {
  let time: FakeTime
  let network: TestNetwork
  let cluster: Cluster

  beforeEach(() => {
    time = new FakeTime()
    network = new TestNetwork(['m.local', 'a.local'])
    cluster = new Cluster(network.connect('m.local'), 'test-cluster', 'm')
  })

  afterEach(() => {
    cluster.stop()
    time.restore()
  })

  it('basic setup', () => {
    expect(cluster.name).toBe('test-cluster/m')
    expect(cluster.identifier).toMatch(/^test-cluster\/m\//)
    expect(cluster.sequence).toBe(0)
    expect(cluster.peerCount).toBe(0)
  })

  describe('#start', () => {
    beforeEach(() => {
      cluster.start()
    })

    afterEach(() => {
      cluster.stop()
    })

    it('increments its sequence', () => {
      expect(cluster.sequence).toBe(1)
    })

    it('sends a heartbeat to other roots', () => {
      expect(network.messages.length).toBe(1)
      const m = network.messages[0]
      expect(m.from).toBe('m.local')
      expect(m.message[0]).toBe(MessageType.SYN)
    })
  })
})
