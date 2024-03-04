import { Digest, Diff } from './node.ts'
import { Address } from './common.ts'
export type { Address }

type NodeDiff = [Digest, Diff[], Address?]
export enum MessageType { SYN, ACK }
export type Message = [MessageType, Digest[], NodeDiff[]]

export interface Transport {
  local(): Address
  roots(): Address[]
  send(to: Address, data: Message): void
  recv(): AsyncGenerator<[Address, Message]>
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
  async *recv(): AsyncGenerator<[Address, Message]> {}
  stop() {}
}
