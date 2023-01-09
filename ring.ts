type Optional<T> = T | undefined
export type Entry<T> = { i: Optional<T>, n: Entry<T>, p: Entry<T> }

export default class Ring<T> {
  private root = {} as Entry<T>
  private current : Entry<T>

  constructor() {
    this.current = this.root.n = this.root.p = this.root
  }

  add(item : T) : Entry<T> {
    const before = this.current
    const added = { i: item, n: before, p: before.p }
    before.p = added.p.n = added
    return added
  }

  remove(entry: Entry<T>) {
    if (this.current === entry) this.current = entry.n
    entry.p.n = entry.n
    entry.n.p = entry.p
    delete entry.i
  }

  next() : Optional<T> {
    this.current = this.current.n
    // when on the root entry, try skipping over it
    if (this.current === this.root) this.current = this.current.n
    return this.current.i
  }

  drop() {
    // don't drop the root entry
    if (this.current !== this.root) this.remove(this.current)
  }
}
