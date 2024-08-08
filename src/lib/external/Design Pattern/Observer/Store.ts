export type NotificationCallback<Value> = (value: Value) => void;
export type UpdateCallback<Value> = (value: Value) => Value;

/**
 * notifyOnce
 * - false: notify subscribers each time set/update is called
 * - true: notify subscribers only when the value changes
 */
export class Store<Value> {
  protected currentValue: Value;
  protected subscriptionSet = new Set<NotificationCallback<Value>>();
  constructor(
    protected initialValue: Value,
    protected notifyOnce: boolean = false,
  ) {
    this.currentValue = initialValue;
  }
  subscribe(callback: NotificationCallback<Value>) {
    this.subscriptionSet.add(callback);
    callback(this.currentValue);
    return () => {
      this.subscriptionSet.delete(callback);
    };
  }
  get value(): Value {
    return this.currentValue;
  }
  set(value: Value) {
    if (this.notifyOnce && this.currentValue === value) return;
    this.currentValue = value;
    for (const callback of this.subscriptionSet) {
      callback(value);
    }
  }
  update(callback: UpdateCallback<Value>) {
    this.set(callback(this.currentValue));
  }
}
