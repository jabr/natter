import { Digest, Diff } from './node.ts'
import { Address } from './common.ts'
export type { Address }

type NodeDiff = [Digest, Diff[], Address?]
export enum MessageType { NUL, SYN, ACK }
export type Message = [MessageType, Digest[], NodeDiff[]]
type AddressedMessage = [Address, Message]

export interface Transport {
  local(): Address
  roots(): Address[]
  send(to: Address, data: Message): void
  recv(): AsyncGenerator<AddressedMessage>
  stop(): void
}

export type TransportConfig = {
  local: Address,
  roots: Address[],
}

export abstract class ConfiguredTransport implements Transport {
  constructor(private config: TransportConfig) {}
  local() { return this.config.local }
  roots() { return this.config.roots }

  // Implemented by subclasses
  send(_to: Address, _data: Message) {}
  async *recv(): AsyncGenerator<AddressedMessage> {}
  stop() {}
}

import Queue from './queue.ts'

const NULL = '\x00h' as Address

export abstract class QueuedTransport extends ConfiguredTransport {
  private messages = new Queue<AddressedMessage>

  push(entry: AddressedMessage) {
    this.messages.push(entry)
  }

  async *recv(): AsyncGenerator<AddressedMessage> {
    for await (const entry of this.messages) {
      if (entry[0] === NULL) break
      yield entry
    }
  }

  stop() {
    this.push([NULL, [MessageType.NUL, [], []]])
  }
}
