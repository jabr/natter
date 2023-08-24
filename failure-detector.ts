export const PHI_FAILURE_THRESHOLD = 8.0

export default class FailureDetector {
  private last: number
  private mean: number
  private squaredInterval: number

  constructor(private weight: number = 0.9, interval: number = 1000) {
    this.last = Date.now()
    this.mean = interval
    this.squaredInterval = interval * interval
  }

  update() {
    const timestamp = Date.now()
    const interval = timestamp - this.last
    const weightedInterval = (1.0 - this.weight) * interval
    this.mean = this.weight * this.mean + weightedInterval
    this.squaredInterval = this.weight * this.squaredInterval + weightedInterval * interval
    this.last = timestamp
  }

  get phi() {
    const interval = Date.now() - this.last
    return interval / (this.mean + 2 * this.standardDeviation)
  }

  private get variance() {
    return this.squaredInterval - this.mean * this.mean
  }

  private get standardDeviation() {
    return Math.sqrt(this.variance)
  }

  [Symbol.for('Deno.customInspect')]() {
    return `last: ${this.last}, phi: ${this.phi}, mean: ${this.mean} ± ${this.standardDeviation} (${this.variance})`
  }
}
