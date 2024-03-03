import {
  describe, it, beforeEach, afterEach, expect, FakeTime
} from './deps.ts'

import Cluster from '../cluster.ts'
import { ConfiguredTransport, Address, Message } from '../transport.ts'

class TestTransport implements Transport {

  public connections = new Map<Address, Message[]>()

  send(to: Address, data: Message) {

  }

  async *recv() {
    // for
  }

  local(): Address
  roots(): Address[]

}

class TestCluster extends Cluster {

}

describe('Cluster', () => {
  let time: FakeTime
  let transport: TestTransport
  let cluster: Cluster

  beforeEach(() => {
    time = new FakeTime()
    transport = new TestTransport()
    cluster = new TestCluster(transport, 'test-cluster')
  })

  afterEach(() => {
    cluster.stop()
    time.restore()
  })

})
