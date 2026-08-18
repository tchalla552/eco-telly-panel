export class Emitter<T extends unknown[]> {
  private handlers = new Set<(...args: T) => void>();

  on(handler: (...args: T) => void): () => void {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  emit(...args: T) {
    for (const handler of [...this.handlers]) handler(...args);
  }

  clear() {
    this.handlers.clear();
  }
}
