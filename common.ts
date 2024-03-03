export type Optional<T> = T | undefined

export type Address = string
export type Identifier = string
export type Key = string
export type Value = string | number | boolean | number[] | string[]

// Should a random event occur?
export function randomlyOccurs(probability: number): boolean {
  return Math.random() < probability
}

// Return a random integer in the range [0,under)
export function randomInteger(under: number): number {
  return Math.floor(Math.random() * under)
}

// Generate a Guassian distributed random value using Box-Muller transform.
export function randomGaussian(mean = 0, standardDeviation = 1) {
  const u = 1 - Math.random() // converting [0,1) to (0,1]
  const v = Math.random()
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
  return mean + (z * standardDeviation)
}

// Return a secure random uint16 [0,65535]
export function secureRandomUint16(): number {
  return crypto.getRandomValues(new Uint16Array(1))[0]
}

// Fisher–Yates shuffle.
// * Note: this modifies the input array.
export function shuffle<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = randomInteger(i + 1)
    const entry = array[i]
    array[i] = array[j]
    array[j] = entry
  }
  return array
}
