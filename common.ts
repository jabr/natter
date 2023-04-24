export type Optional<T> = T | undefined

export type Address = string
export type Identifier = string
export type Key = string
export type Value = string | number | boolean | number[] | string[]

// Should a random event occur?
export function randomlyOccurs(probability: number) : boolean {
  return Math.random() < probability
}

// Return a random integer in the range [0,under)
export function randomInteger(under: number) : number {
  return Math.floor(Math.random() * under)
}

// Return a secure random uint16 [0,65535]
export function secureRandomUint16() : number {
  return crypto.getRandomValues(new Uint16Array(1))[0]
}

// Fisher–Yates shuffle.
// * Note: this modifies the input array.
export function shuffle<T>(array: T[]) : T[] {
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = randomInteger(i + 1)
    const entry = array[i]
    array[i] = array[j]
    array[j] = entry
  }
  return array
}
