export class MockStorageProvider {
  set(key, value) {
    console.log('set', key, 'to', value);
  }
  get(key) {
    console.log('get', key);
    return null;
  }
}
