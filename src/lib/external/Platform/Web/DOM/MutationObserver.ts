type NotificationCallback<Value> = (value: Value) => void;
export class ElementAddedObserver {
  constructor({ source, options, selector }: { source: Node; options: MutationObserverInit; selector: string }) {
    this.mutationObserver = new MutationObserver((mutationRecords: MutationRecord[]) => {
      for (const record of mutationRecords) {
        switch (record.type) {
          case 'attributes':
          case 'characterData':
            if (record.target instanceof HTMLElement && record.target.matches(selector)) {
              this.add(record.target);
            }
            break;
          case 'childList':
            for (const node of record.addedNodes) {
              if (node instanceof HTMLElement && node.matches(selector)) {
                this.add(node);
              }
            }
            break;
        }
      }
    });
    this.mutationObserver.observe(source, options);
  }
  public subscribe(callback: NotificationCallback<HTMLElement>) {
    this.subscriptionSet.add(callback);
    for (const element of this.matchSet) {
      callback(element);
    }
    return () => {
      this.subscriptionSet.delete(callback);
    };
  }
  protected mutationObserver: MutationObserver;
  protected matchSet = new Set<HTMLElement>();
  protected subscriptionSet = new Set<NotificationCallback<HTMLElement>>();
  private add(element: HTMLElement) {
    this.matchSet.add(element);
    for (const callback of this.subscriptionSet) {
      callback(element);
    }
  }
}
