import { Digest, Diff } from './node.ts'
import { Address } from './common.ts'

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

export abstract class ConfiguredTransport implements Transport {
  constructor(private config: { local: Address, roots: Address[] }) {}
  local() { return this.config.local }
  roots() { return this.config.roots }

  // Implemented by subclasses
  send(_to: Address, _data: Message) {}
  async *recv() {}
  stop() {}
}
