export default class Queue<T> {
  private items: T[] = []
  private deferred = Promise.withResolvers<void>()

  get length() { return this.items.length }

  async* [Symbol.asyncIterator]() {
    while (true) {
      yield await this.take()
    }
  }

  async take(): Promise<T> {
    while (true) {
      const item = this.items.shift()
      if (item) return item
      await this.deferred.promise
      this.deferred = Promise.withResolvers<void>()
    }
  }

  push(item: T) {
    this.items.push(item)
    this.deferred.resolve()
    return this
  }
}
