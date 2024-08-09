type NotificationCallback<Value> = (value: Value) => { abort: boolean } | void;
export class ElementAddedObserver {
  constructor({ source, options, selector }: { source: Node & { querySelectorAll?: Function }; options: MutationObserverInit; selector: string }) {
    this.mutationObserver = new MutationObserver((mutationRecords: MutationRecord[]) => {
      for (const record of mutationRecords) {
        switch (record.type) {
          case 'attributes':
          case 'characterData':
            if (record.target instanceof Element && record.target.matches(selector)) {
              this.add(record.target);
            }
            break;
          case 'childList':
            for (const node of record.addedNodes) {
              if (node instanceof Element && node.matches(selector)) {
                this.add(node);
              }
            }
            break;
        }
      }
    });
    this.mutationObserver.observe(source, options);

    const findMatches = (source: Element) => {
      if (source.matches(selector)) {
        this.add(source);
      }
      for (const element of source.querySelectorAll(selector)) {
        this.add(element);
      }
    };
    if (source instanceof Element) findMatches(source);
    else if (source.querySelectorAll) {
      for (const element of source.querySelectorAll(selector)) {
        this.add(element);
      }
    } else {
      if (source.parentElement) findMatches(source.parentElement);
      else {
        for (const node of source.childNodes) {
          if (node instanceof Element) {
            findMatches(node);
          }
        }
      }
    }
  }
  public subscribe(callback: NotificationCallback<Element>): () => void {
    this.subscriptionSet.add(callback);
    for (const element of this.matchSet) {
      if (callback(element)?.abort === true) {
        this.subscriptionSet.delete(callback);
        return () => {};
      }
    }
    return () => {
      this.subscriptionSet.delete(callback);
    };
  }
  protected mutationObserver: MutationObserver;
  protected matchSet = new Set<Element>();
  protected subscriptionSet = new Set<NotificationCallback<Element>>();
  private add(element: Element) {
    this.matchSet.add(element);
    for (const callback of this.subscriptionSet) {
      if (callback(element)?.abort === true) {
        this.subscriptionSet.delete(callback);
      }
    }
  }
}
