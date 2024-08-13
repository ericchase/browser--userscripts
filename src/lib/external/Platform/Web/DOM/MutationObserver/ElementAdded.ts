type NotificationCallback<T> = (data: T) => { abort: boolean } | void;

export class ElementAddedObserver {
  constructor({ source = document.documentElement, options = { subtree: true }, selector, includeExistingElements = true }: { source?: Node & { querySelectorAll?: Function }; options?: { subtree?: boolean }; selector: string; includeExistingElements?: boolean }) {
    this.mutationObserver = new MutationObserver((mutationRecords: MutationRecord[]) => {
      for (const record of mutationRecords) {
        if (record.type === 'childList') {
          if (record.target instanceof Element && record.target.matches(selector)) {
            this.send(record.target);
          }
          for (const node of record.addedNodes) {
            if (node instanceof Element && node.matches(selector)) {
              this.send(node);
            }
          }
        }
      }
    });
    this.mutationObserver.observe(source, { childList: true, subtree: options.subtree ?? true });

    if (includeExistingElements === true) {
      const findMatches = (source: Element) => {
        if (source.matches(selector)) {
          this.send(source);
        }
        for (const element of source.querySelectorAll(selector)) {
          this.send(element);
        }
      };
      if (source instanceof Element) findMatches(source);
      else if (source.querySelectorAll) {
        for (const element of source.querySelectorAll(selector)) {
          this.send(element);
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
  private send(element: Element) {
    if (!this.matchSet.has(element)) {
      this.matchSet.add(element);
      for (const callback of this.subscriptionSet) {
        if (callback(element)?.abort === true) {
          this.subscriptionSet.delete(callback);
        }
      }
    }
  }
}
