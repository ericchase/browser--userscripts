export class LocalStorageProvider<Key extends { toString: () => string }> {
  set(key: Key, value: string) {
    window.localStorage.setItem(key.toString(), value.toString());
  }
  get(key: Key): string | null {
    return window.localStorage.getItem(key.toString());
  }
}
