export class LocalStorageProvider {
    set(key, value) {
        window.localStorage.setItem(key.toString(), value.toString());
    }
    get(key) {
        return window.localStorage.getItem(key.toString());
    }
}
