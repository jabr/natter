// Standard Normal variate using Box-Muller transform.
function gaussianRandom(mean = 0, stdev = 1) {
  let u = 1 - Math.random(); //Converting [0,1) to (0,1)
  let v = Math.random();
  let z = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
  // Transform to the desired mean and standard deviation:
  return z * stdev + mean;
}

// probability density function
function pdf(x: number) {
  const m = this.standardDeviation * Math.sqrt(2 * Math.PI);
  const e = Math.exp(-Math.pow(x - this.mean, 2) / (2 * this.variance));
  return e / m;
}

class FailureDetector {
  private last : number
  private mean : number
  private squaredInterval : number

  constructor(private weight: number, interval : number) {
    this.last = Date.now()
    this.mean = interval
    this.squaredInterval = interval * interval
  }

  update(timestamp = Date.now()) {
    const interval = timestamp - this.last
    this.mean = this.weight * this.mean + (1.0 - this.weight) * interval
    this.squaredInterval = this.weight * this.squaredInterval + (1.0 - this.weight) * interval * interval
    this.last = timestamp
  }

  // probability density function
  pdf(timestamp = Date.now()) {
    const interval = timestamp - this.last
    const m = this.standardDeviation * Math.sqrt(2 * Math.PI)
    const e = Math.exp(-Math.pow(interval - this.mean, 2) / (2 * this.variance))
    console.log(interval, m, e)
    return e / m
  }

  // cumulative density function
  cdf(timestamp = Date.now()) {
        return 0.5 * erfc(-(x - this.mean) / (this.standardDeviation * Math.sqrt(2)));
  }

  phi(timestamp = Date.now()) {
    const interval = timestamp - this.last
    return interval / (this.mean + 2 * this.standardDeviation)
  }

  get variance() {
    return this.squaredInterval - this.mean * this.mean
  }

  get standardDeviation() {
    return Math.sqrt(this.variance)
  }

  [Symbol.for('Deno.customInspect')]() {
    return `last: ${this.last}, mean: ${this.mean}, variance: ${this.variance}, stdev: ${this.standardDeviation}`
  }
}

const fd = new FailureDetector(0.9, 1000)
console.log(fd)
let time = Date.now()

for (let x = 1; x < 1000; x += 1) {
  time += gaussianRandom(1250, 100)
  fd.update(time)
  console.log('>', fd)
}

for (const offset of [0, 1000, 1150, 1200, 1250, 1300, 1350, 1450, 1500, 1650, 1850, 2050, 2250, 2450, 2650, 2850, 9000]) {
  console.log(offset, fd.phi(time + offset))
}
