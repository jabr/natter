import {
  describe, it, beforeEach,
  expect, assert,
} from './deps.ts'

import {
  Address, MessageType, Message,
  Transport, ConfiguredTransport, QueuedTransport
} from '../transport.ts'

describe('ConfiguredTransport', () => {
  let transport: ConfiguredTransport

  beforeEach(() => {
    class ConfiguredTransportImpl extends ConfiguredTransport {}
    transport = new ConfiguredTransportImpl({
      local: 'local',
      roots: [ 'root1', 'root2', 'root3' ]
    })
  })

  it('implements the Transport interface', () => {
    // this will fail to compile if it doesn't implement the interface
    const x: Transport = transport
    expect(x).toBeDefined()
  })

  it('#local returns the configured address', () => {
    expect(transport.local()).toBe('local')
  })

  it('#roots returns the configured address', () => {
    const roots = transport.roots()
    expect(roots.length).toBe(3)
    expect(roots).toContain('root1')
    expect(roots).toContain('root2')
    expect(roots).toContain('root3')
  })
})

describe('QueuedTransport', () => {
  let transport: QueuedTransport

  beforeEach(() => {
    class QueuedTransportImpl extends QueuedTransport {}
    transport = new QueuedTransportImpl({ local: 'local', roots: [] })
  })

  it('implements the Transport interface', () => {
    // this will fail to compile if it doesn't implement the interface
    const x: Transport = transport
    expect(x).toBeDefined()
  })

  it('is an instance of ConfiguredTransport', () => {
    expect(transport instanceof ConfiguredTransport).toBe(true)
  })

  describe('#recv', () => {
    // @todo
  })

  describe('#stop', () => {
    // @todo
  })
})
