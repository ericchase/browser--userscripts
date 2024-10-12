// INDEXEDDB
// https://github.com/alexeagleson/template-indexeddb

function getIndexedDB() {
  // This works on all devices/browsers, and uses IndexedDBShim as a final fallback
  // @ts-ignore
  const _ = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB;
  if (!_) throw 'undefined: indexedDB';
  return _;
}

interface DBRow {
  url: string;
  order: number;
}

function dbv1_open(mode: 'readonly' | 'readwrite', success_fn: (args: { db: IDBDatabase; transaction: IDBTransaction; store: IDBObjectStore }) => Promise<void>) {
  const request = getIndexedDB().open('GithubFavorites', 1);

  request.onerror = (ev: Event) => {
    console.error('An error occurred with IndexedDB');
    console.error(ev);
  };

  // Create the schema on create and version upgrade
  request.onupgradeneeded = () => {
    console.log('Database created/upgraded successfully');
    const db = request.result;
    const store = db.createObjectStore('repos', { keyPath: 'url' });
    store.createIndex('order', ['order'], { unique: true });
  };

  request.onsuccess = async () => {
    const db = request.result;
    const transaction = db.transaction('repos', mode);
    const store = transaction.objectStore('repos');

    success_fn({ db, transaction, store });

    transaction.oncomplete = () => {
      db.close();
    };
  };
}

function dbv1_get(url: string): Promise<DBRow> {
  return new Promise<DBRow>((resolve, reject) => {
    dbv1_open('readonly', async ({ store }) => {
      const getQuery: IDBRequest<DBRow> = store.get(url);
      getQuery.onerror = () => {
        reject();
      };
      getQuery.onsuccess = () => {
        resolve(getQuery.result);
      };
    });
  });
}

function dbv1_getAll(): Promise<DBRow[]> {
  return new Promise<DBRow[]>((resolve, reject) => {
    dbv1_open('readonly', async ({ store }) => {
      const getQuery: IDBRequest<DBRow[]> = store.getAll();
      getQuery.onerror = () => {
        reject();
      };
      getQuery.onsuccess = () => {
        resolve(getQuery.result);
      };
    });
  });
}

function dbv1_getOrdered(): Promise<DBRow[]> {
  return new Promise<DBRow[]>((resolve, reject) => {
    dbv1_open('readonly', async ({ store }) => {
      const orderIndex = store.index('order');
      const getQuery: IDBRequest<DBRow[]> = orderIndex.getAll();
      getQuery.onerror = () => {
        reject();
      };
      getQuery.onsuccess = () => {
        resolve(getQuery.result);
      };
    });
  });
}

function dbv1_getAllKeys(): Promise<IDBValidKey[]> {
  return new Promise<IDBValidKey[]>((resolve, reject) => {
    dbv1_open('readonly', async ({ store }) => {
      const getQuery = store.getAllKeys();
      getQuery.onerror = () => {
        reject();
      };
      getQuery.onsuccess = () => {
        resolve(getQuery.result);
      };
    });
  });
}

function dbv1_add(url: string): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    dbv1_open('readwrite', async ({ store }) => {
      const orderIndex = store.index('order');
      const cursorQuery = orderIndex.openCursor(null, 'prev');
      cursorQuery.onerror = () => {
        console.log('Error', cursorQuery.error);
        resolve(false);
      };
      cursorQuery.onsuccess = () => {
        const cursor = cursorQuery.result;
        const row: DBRow = cursor?.value;
        const order = row ? row.order + 1 : 0;
        const addQuery = store.add({ url, order });
        addQuery.onerror = () => {
          console.log('Error', addQuery.error);
          resolve(false);
        };
        addQuery.onsuccess = () => {
          resolve(true);
        };
      };
    });
  });
}

function dbv1_delete(url: string): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    dbv1_open('readwrite', async ({ store }) => {
      const deleteQuery = store.delete(url);
      deleteQuery.onerror = () => {
        console.log('Error', deleteQuery.error);
        resolve(false);
      };
      deleteQuery.onsuccess = () => {
        resolve(true);
      };
    });
  });
}

function dbv1_put(url: string, order: number): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    dbv1_open('readwrite', async ({ store }) => {
      const putQuery = store.put({ url, order });
      putQuery.onerror = () => {
        console.log('Error', putQuery.error);
        resolve(false);
      };
      putQuery.onsuccess = () => {
        resolve(true);
      };
    });
  });
}

function dbv1_raise(url: string): void {
  dbv1_open('readwrite', async ({ store }) => {
    const currentQuery = store.get(url);
    currentQuery.onerror = () => {
      console.log('Error', currentQuery.error);
    };
    currentQuery.onsuccess = () => {
      const current: DBRow = currentQuery.result;
      const orderIndex = store.index('order');
      const orderCursorQuery = orderIndex.openCursor(null, 'prev');
      let found = false;
      orderCursorQuery.onsuccess = () => {
        const cursor = orderCursorQuery.result;
        if (cursor) {
          const row: DBRow = cursor.value;
          if (found) {
            const previous = row;
            store.put({ url: previous.url, order: -1 });
            store.put({ url: current.url, order: previous.order });
            store.put({ url: previous.url, order: current.order });
          } else {
            if (row.order === current.order) {
              found = true;
            }
            cursor.continue();
          }
        }
      };
    };
  });
}

function dbv1_lower(url: string) {
  dbv1_open('readwrite', async ({ store }) => {
    const currentQuery = store.get(url);
    currentQuery.onerror = () => {
      console.log('Error', currentQuery.error);
    };
    currentQuery.onsuccess = () => {
      const current: DBRow = currentQuery.result;
      const orderIndex = store.index('order');
      const orderCursorQuery = orderIndex.openCursor(null, 'next');
      let found = false;
      orderCursorQuery.onsuccess = () => {
        const cursor = orderCursorQuery.result;
        if (cursor) {
          const row: DBRow = cursor.value;
          if (found) {
            const next = row;
            store.put({ url: next.url, order: -1 });
            store.put({ url: current.url, order: next.order });
            store.put({ url: next.url, order: current.order });
          } else {
            if (row.order === current.order) {
              found = true;
            }
            cursor.continue();
          }
        }
      };
    };
  });
}
