type NotificationCallback<Value> = (value: Value) => { abort: boolean } | void;

export class AttributeObserver {
  constructor({ source, options = { attributeOldValue: true, subtree: true } }: { source: Node; options?: { attributeFilter?: string[]; attributeOldValue?: boolean; subtree?: boolean } }) {
    this.mutationObserver = new MutationObserver((mutationRecords: MutationRecord[]) => {
      for (const record of mutationRecords) {
        if (record.type === 'attributes') {
          this.send(record.target as Element, record.attributeName as string, record.oldValue);
        }
      }
    });
    this.mutationObserver.observe(source, { attributes: true, attributeFilter: options.attributeFilter, attributeOldValue: options.attributeOldValue ?? true, subtree: options.subtree ?? true });
  }
  public subscribe(callback: NotificationCallback<{ element: Element; attributeName: string; oldValue?: string }>): () => void {
    this.subscriptionSet.add(callback);
    return () => {
      this.subscriptionSet.delete(callback);
    };
  }
  protected mutationObserver: MutationObserver;
  protected subscriptionSet = new Set<NotificationCallback<{ element: Element; attributeName: string; oldValue?: string }>>();
  private send(element: Element, attributeName: string, oldValue: string | null) {
    for (const callback of this.subscriptionSet) {
      if (callback({ element, attributeName, oldValue: oldValue ?? undefined })?.abort === true) {
        this.subscriptionSet.delete(callback);
      }
    }
  }
}
