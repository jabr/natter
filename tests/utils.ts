export const random = {
  // Generate a Guassian distributed random value using Box-Muller transform.
  gaussian: function(mean = 0, standardDeviation = 1) {
    const u = 1 - Math.random() // converting [0,1) to (0,1]
    const v = Math.random()
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
    return mean + (z * standardDeviation)
  }
}
