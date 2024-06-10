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
export class Store {
    currentValue;
    subscriptionSet = new Set();
    constructor(initialValue) {
        this.currentValue = initialValue;
    }
    subscribe(callback) {
        this.subscriptionSet.add(callback);
        callback(this.currentValue);
        return () => {
            this.subscriptionSet.delete(callback);
        };
    }
    get value() {
        return this.currentValue;
    }
    set(value) {
        this.currentValue = value;
        for (const callback of this.subscriptionSet) {
            callback(value);
        }
    }
    update(callback) {
        this.set(callback(this.currentValue));
    }
}
export class ComputedStore {
    source;
    computeFn;
    subscriptionSet = new Set();
    sourceUnsubscribe = undefined;
    constructor(source, //
    computeFn) {
        this.source = source;
        this.computeFn = computeFn;
    }
    subscribe(callback) {
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
    get value() {
        return this.computeFn(this.source.value);
    }
}
export class SetStore {
    keySet = new Set();
    subscriptionMap = new Map();
    subscribe(key, callback) {
        const subscriptionSet = this.subscriptionMap.get(key);
        if (subscriptionSet === undefined) {
            this.subscriptionMap.set(key, new Set([callback]));
        }
        else {
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
    set(key, value) {
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
        }
        else {
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
    update(key, callback) {
        this.set(key, callback(this.keySet.has(key)));
    }
    toggle(key) {
        this.update(key, (value) => {
            return !value;
        });
    }
}
export class Warehouse {
    defaultValue;
    valueMap = new Map();
    subscriptionMap = new Map();
    constructor(defaultValue) {
        this.defaultValue = defaultValue;
    }
    subscribe(key, callback) {
        const subscriptionSet = this.subscriptionMap.get(key);
        if (subscriptionSet === undefined) {
            this.subscriptionMap.set(key, new Set([callback]));
        }
        else {
            subscriptionSet.add(callback);
        }
        callback(key, this.valueMap.get(key) ?? this.defaultValue);
        return () => {
            if (subscriptionSet !== undefined) {
                subscriptionSet.delete(callback);
            }
        };
    }
    set(key, value) {
        this.valueMap.set(key, value);
        const callbackSet = this.subscriptionMap.get(key);
        if (callbackSet !== undefined) {
            for (const callback of callbackSet) {
                callback(key, value);
            }
        }
    }
    update(key, callback) {
        this.set(key, callback(key, this.valueMap.get(key) ?? this.defaultValue));
    }
}
