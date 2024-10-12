// Copyright 2024 ericchase
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

export type NotificationCallback<Value> = (value: Value) => void;
export type UpdateCallback<Value> = (value: Value) => Value;

export class Store<Value> {
  protected currentValue: Value;
  protected subscriptionSet = new Set<NotificationCallback<Value>>();
  constructor(initialValue: Value) {
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
    this.currentValue = value;
    for (const callback of this.subscriptionSet) {
      callback(value);
    }
  }
  update(callback: UpdateCallback<Value>) {
    this.set(callback(this.currentValue));
  }
}
export class ComputedStore<SourceValue, ComputedValue> {
  protected subscriptionSet = new Set<NotificationCallback<ComputedValue>>();
  protected sourceUnsubscribe: (() => void) | undefined = undefined;
  constructor(
    protected source: Store<SourceValue> | ComputedStore<SourceValue, any>, //
    protected computeFn: (value: SourceValue) => ComputedValue,
  ) {}
  subscribe(callback: NotificationCallback<ComputedValue>) {
    let cachedValue = this.computeFn(this.source.value);
    if (this.subscriptionSet.size === 0) {
      this.sourceUnsubscribe = this.source.subscribe((value) => {
        const newCachedValue = this.computeFn(value);
        if (cachedValue !== newCachedValue) {
          cachedValue = newCachedValue;
          for (const callback of this.subscriptionSet) {
            callback(newCachedValue);
          }
        }
      });
    }
    this.subscriptionSet.add(callback);
    callback(cachedValue);
    return () => {
      this.subscriptionSet.delete(callback);
      if (this.subscriptionSet.size === 0) {
        this.sourceUnsubscribe?.();
      }
    };
  }
  get value(): ComputedValue {
    return this.computeFn(this.source.value);
  }
}
export class SetStore<Key> {
  protected keySet = new Set<Key>();
  protected subscriptionMap = new Map<Key, Set<NotificationCallback<boolean>>>();
  subscribe(key: Key, callback: NotificationCallback<boolean>) {
    const subscriptionSet = this.subscriptionMap.get(key);
    if (subscriptionSet === undefined) {
      this.subscriptionMap.set(key, new Set([callback]));
    } else {
      subscriptionSet.add(callback);
    }
    callback(this.keySet.has(key));
    return () => {
      const subscriptionSet = this.subscriptionMap.get(key);
      if (subscriptionSet !== undefined) {
        subscriptionSet.delete(callback);
      }
    };
  }
  set(key: Key, value: boolean) {
    if (value === true) {
      if (!this.keySet.has(key)) {
        this.keySet.add(key);
        const callbackSet = this.subscriptionMap.get(key);
        if (callbackSet !== undefined) {
          for (const callback of callbackSet) {
            callback(true);
          }
        }
      }
    } else {
      if (this.keySet.has(key)) {
        this.keySet.delete(key);
        const callbackSet = this.subscriptionMap.get(key);
        if (callbackSet !== undefined) {
          for (const callback of callbackSet) {
            callback(false);
          }
        }
      }
    }
  }
  update(key: Key, callback: UpdateCallback<boolean>) {
    this.set(key, callback(this.keySet.has(key)));
  }
  toggle(key: Key) {
    this.update(key, (value) => {
      return !value;
    });
  }
}

export type KeyValueNotificationCallback<Key, Value> = (key: Key, value: Value) => void;
export type KeyValueUpdateCallback<Key, Value> = (key: Key, value: Value) => Value;

export class Warehouse<Key, Value> {
  protected valueMap = new Map<Key, Value>();
  protected subscriptionMap = new Map<Key, Set<KeyValueNotificationCallback<Key, Value>>>();
  constructor(public defaultValue: Value) {}
  subscribe(key: Key, callback: KeyValueNotificationCallback<Key, Value>) {
    const subscriptionSet = this.subscriptionMap.get(key);
    if (subscriptionSet === undefined) {
      this.subscriptionMap.set(key, new Set([callback]));
    } else {
      subscriptionSet.add(callback);
    }
    callback(key, this.valueMap.get(key) ?? this.defaultValue);
    return () => {
      if (subscriptionSet !== undefined) {
        subscriptionSet.delete(callback);
      }
    };
  }
  set(key: Key, value: Value) {
    this.valueMap.set(key, value);
    const callbackSet = this.subscriptionMap.get(key);
    if (callbackSet !== undefined) {
      for (const callback of callbackSet) {
        callback(key, value);
      }
    }
  }
  update(key: Key, callback: KeyValueUpdateCallback<Key, Value>) {
    this.set(key, callback(key, this.valueMap.get(key) ?? this.defaultValue));
  }
}
