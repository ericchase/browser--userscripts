export declare class LocalStorageProvider<Key extends {
    toString: () => string;
}> {
    set(key: Key, value: string): void;
    get(key: Key): string | null;
}
