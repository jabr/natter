import FailureDetector from './failure-detector.ts'

type Sequence = number
type Value = string|number|boolean|number[]|string[]
type SequencedValue = [ Value, Sequence ]
enum State { Pending, Alive, Dead }

export abstract class Node {
  public state = State.Pending
  public sequence : Sequence = 0
  public values : { [index: string] : SequencedValue } = {}

  constructor(public identifier: string, public address: [string, number]) {}

  public get(key: string) : Value|undefined {
    return this.values[key]?.[0]
  }

  protected currentSequenceFor(key: string): Sequence {
    return this.values[key]?.[1] ?? 0
  }

  public diff(from: Sequence) {
    return Object.entries(this.values).filter(
      ([ _key, [ _value, sequence ] ]) => sequence > from
    )
  }

  public discardable() : boolean { return false }
}

export class PeerNode extends Node {
  public detector? : FailureDetector

  public apply(sequence: Sequence, updates: [string, SequencedValue][]) {
    if (sequence <= this.sequence) return // is update older than our current data?
    for (const update of updates) {
      const [ key, [ value, sequence ] ] = update
      if (sequence > this.currentSequenceFor(key)) {
        this.values[key] = [ value, sequence ]
      }
    }
    this.sequence = sequence
    // @todo: update detector
  }

  public discardable() {
    // @todo: already dead and grace period elapsed?
    // @todo: check detector
    return false
  }
}

export class SelfNode extends Node {
  public state = State.Alive

  public set(key: string, value: Value) : Value {
    this.values[key] = [ value, ++this.sequence ]
    // @todo: initiate sync? or responsibility of owner?
    return value
  }

  public heartbeat() {
    this.set('heartbeat', Date.now())
  }
}
