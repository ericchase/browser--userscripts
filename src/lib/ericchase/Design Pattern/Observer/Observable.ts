export type UnobserveFn = () => void;
export type ObserverCallback = (unobserve: UnobserveFn) => void;

export class Observable {
  constructor(
    public onStart: () => void,
    public onEnd: () => void,
  ) {}
  public notify(): void {
    for (const callback of this.callbackSet) {
      callback(() => {
        this.callbackSet.delete(callback);
        if (this.callbackSet.size === 0) {
          this.onEnd();
        }
      });
    }
  }
  public observe(callback: ObserverCallback): UnobserveFn {
    this.callbackSet.add(callback);
    if (this.callbackSet.size === 1) {
      this.onStart();
    }
    return () => {
      this.callbackSet.delete(callback);
      if (this.callbackSet.size === 0) {
        this.onEnd();
      }
    };
  }
  protected callbackSet = new Set<ObserverCallback>();
}
