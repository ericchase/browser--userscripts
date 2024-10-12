export class MockStorageProvider {
  set(key: string, value: string) {
    console.log('set', key, 'to', value);
  }
  get(key: string): string | null {
    console.log('get', key);
    return null;
  }
}
