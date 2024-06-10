export type NotificationCallback<Value> = (value: Value) => void;
export type UpdateCallback<Value> = (value: Value) => Value;
export declare class Store<Value> {
  protected currentValue: Value;
  protected subscriptionSet: Set<NotificationCallback<Value>>;
  constructor(initialValue: Value);
  subscribe(callback: NotificationCallback<Value>): () => void;
  get value(): Value;
  set(value: Value): void;
  update(callback: UpdateCallback<Value>): void;
}
export declare class ComputedStore<SourceValue, ComputedValue> {
  protected source: Store<SourceValue> | ComputedStore<SourceValue, any>;
  protected computeFn: (value: SourceValue) => ComputedValue;
  protected subscriptionSet: Set<NotificationCallback<ComputedValue>>;
  protected sourceUnsubscribe: (() => void) | undefined;
  constructor(
    source: Store<SourceValue> | ComputedStore<SourceValue, any>, //
    computeFn: (value: SourceValue) => ComputedValue,
  );
  subscribe(callback: NotificationCallback<ComputedValue>): () => void;
  get value(): ComputedValue;
}
export declare class SetStore<Key> {
  protected keySet: Set<Key>;
  protected subscriptionMap: Map<Key, Set<NotificationCallback<boolean>>>;
  subscribe(key: Key, callback: NotificationCallback<boolean>): () => void;
  set(key: Key, value: boolean): void;
  update(key: Key, callback: UpdateCallback<boolean>): void;
  toggle(key: Key): void;
}
export type KeyValueNotificationCallback<Key, Value> = (key: Key, value: Value) => void;
export type KeyValueUpdateCallback<Key, Value> = (key: Key, value: Value) => Value;
export declare class Warehouse<Key, Value> {
  defaultValue: Value;
  protected valueMap: Map<Key, Value>;
  protected subscriptionMap: Map<Key, Set<KeyValueNotificationCallback<Key, Value>>>;
  constructor(defaultValue: Value);
  subscribe(key: Key, callback: KeyValueNotificationCallback<Key, Value>): () => void;
  set(key: Key, value: Value): void;
  update(key: Key, callback: KeyValueUpdateCallback<Key, Value>): void;
}
