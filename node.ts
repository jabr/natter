import { Optional, Address, Identifier, Key, Value } from './common.ts'
import FailureDetector, { PHI_FAILURE_THRESHOLD } from './failure-detector.ts'

type Sequence = number
type SequencedValue = [Value, Sequence]
export type Digest = [Identifier, Sequence]
export type Diff = [Key, SequencedValue]

const DISCARD_GRACE_PERIOD = 24 * 60 * 60 * 1000 // discard after inactive for one day

export abstract class Node {
  public sequence: Sequence = 0
  protected values: { [index: Key]: SequencedValue } = {}

  constructor(public identifier: Identifier, public address: Address) { }
  get digest(): Digest { return [this.identifier, this.sequence] }

  public get(key: Key): Optional<Value> {
    return this.values[key]?.[0]
  }

  public diff(from: Sequence): Diff[] {
    return Object.entries(this.values).filter(
      ([_key, [_value, sequence]]) => sequence > from
    )
  }

  public discardable(): boolean { return false }
}

export class PeerNode extends Node {
  private detector?: FailureDetector
  private inactiveSince = Infinity

  private currentSequenceFor(key: Key): Sequence {
    return this.values[key]?.[1] ?? 0
  }

  public apply(sequence: Sequence, updates: Diff[]): void {
    // is update older than our current data?
    if (sequence <= this.sequence) return

    if (this.detector) {
      // if detector exists, update the detector
      this.detector.update()
    } else {
      // otherwise, create a new detector
      this.detector = new FailureDetector()
    }

    for (const update of updates) {
      const [key, [value, sequence]] = update
      if (sequence > this.currentSequenceFor(key)) {
        this.values[key] = [value, sequence]
      }
    }
    this.sequence = sequence
  }

  public get active(): boolean { return this.detector !== undefined }
  public get phi(): number { return this.detector?.phi ?? NaN }

  public inactive() {
    this.inactiveSince = Date.now()
    this.detector = undefined
  }

  public discardable(): boolean {
    if (this.detector) {
      if (this.detector.phi > PHI_FAILURE_THRESHOLD) {
        // failure detector confidence has passed the threshold,
        // so mark this node as inactive (and later discardable)
        this.inactive()
      }
      return false
    }

    // node is discardable if the inactive grace period has elapsed
    return (Date.now() - this.inactiveSince > DISCARD_GRACE_PERIOD)
  }
}

export class SelfNode extends Node {
  public set(key: Key, value: Value): void {
    this.values[key] = [value, ++this.sequence]
  }
}
