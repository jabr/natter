import FailureDetector, { PHI_FAILURE_THRESHOLD } from './failure-detector.ts'

export type Address = string
export type Sequence = number
export type Value = string|number|boolean|number[]|string[]
type SequencedValue = [ Value, Sequence ]

const DISCARD_GRACE_PERIOD = 24 * 60 * 60 // discard after inactive for one day

export abstract class Node {
  public sequence : Sequence = 0
  public values : { [index: string] : SequencedValue } = {}

  constructor(public identifier: string, public address: Address) {}

  public get(key: string) : Value|undefined {
    return this.values[key]?.[0]
  }

  public diff(from: Sequence) {
    return Object.entries(this.values).filter(
      ([ _key, [ _value, sequence ] ]) => sequence > from
    )
  }

  public discardable() : boolean { return false }
}

export class PeerNode extends Node {
  public detector = new FailureDetector()
  public inactiveSince = 0

  protected currentSequenceFor(key: string): Sequence {
    return this.values[key]?.[1] ?? 0
  }

  public apply(sequence: Sequence, updates: [string, SequencedValue][]) {
    if (sequence <= this.sequence) return // is update older than our current data?

    if (this.active) {
      // if active, simply update the detector
      this.detector.update()
    } else {
      // otherwise, reset the detector and clear inactive flag
      this.detector = new FailureDetector()
      this.inactiveSince = 0
    }

    for (const update of updates) {
      const [ key, [ value, sequence ] ] = update
      if (sequence > this.currentSequenceFor(key)) {
        this.values[key] = [ value, sequence ]
      }
    }
    this.sequence = sequence
  }

  public get active() { return this.inactiveSince === 0 }

  public discardable() {
    if (this.inactiveSince > 0) {
      // previously marked as inactive, so now check if the grace period has elapsed
      if (Date.now() - this.inactiveSince > DISCARD_GRACE_PERIOD) return true
    } else if (this.detector.phi > PHI_FAILURE_THRESHOLD)  {
      // failure detector confidence has passed the threshold,
      // so mark this node as inactive (and later discardable)
      this.inactiveSince = Date.now()
    }
    return false
  }
}

export class SelfNode extends Node {
  public set(key: string, value: Value) : Value {
    this.values[key] = [ value, ++this.sequence ]
    // @todo: initiate sync? or responsibility of owner?
    return value
  }

  public heartbeat() {
    this.set('heartbeat', Date.now())
  }
}
