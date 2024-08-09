type NotificationCallback<Value> = (value?: Value, error?: Error) => { abort: boolean } | void;

export class JobQueue<T> {
  constructor(public delay_ms: number) {}
  public add(fn: () => Promise<T>) {
    this.queue.push(fn);
    if (this.running === false) {
      this.running = true;
      this.run();
    }
  }
  public get done() {
    return this.completionCount === this.queue.length ? true : false;
  }
  public subscribe(callback: NotificationCallback<T>): () => void {
    this.subscriptionSet.add(callback);
    for (const result of this.results) {
      if (callback(result.value, result.error)?.abort === true) {
        this.subscriptionSet.delete(callback);
        return () => {};
      }
    }
    return () => {
      this.subscriptionSet.delete(callback);
    };
  }
  protected queue: (() => Promise<T>)[] = [];
  protected queueIndex = 0;
  protected completionCount = 0;
  protected results: { value?: T; error?: Error }[] = [];
  protected running = false;
  protected subscriptionSet = new Set<NotificationCallback<T>>();
  protected run() {
    if (this.queueIndex < this.queue.length) {
      this.queue[this.queueIndex++]()
        .then((value) => this.send({ value }))
        .catch((error) => this.send({ error }));
      setTimeout(() => this.run(), this.delay_ms);
    } else {
      this.running = false;
    }
  }
  protected send(result: { value?: T; error?: Error }) {
    this.completionCount++;
    this.results.push(result);
    for (const callback of this.subscriptionSet) {
      if (callback(result.value, result.error)?.abort === true) {
        this.subscriptionSet.delete(callback);
      }
    }
  }
}
