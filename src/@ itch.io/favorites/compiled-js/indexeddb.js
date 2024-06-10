// INDEXEDDB
// https://github.com/alexeagleson/template-indexeddb
function getIndexedDB() {
  // This works on all devices/browsers, and uses IndexedDBShim as a final fallback
  // @ts-ignore
  const _ = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB;
  if (!_) throw 'undefined: indexedDB';
  return _;
}
function dbv1_open(mode, success_fn) {
  const request = getIndexedDB().open('GithubFavorites', 1);
  request.onerror = function (ev) {
    console.error('An error occurred with IndexedDB');
    console.error(ev);
  };
  // Create the schema on create and version upgrade
  request.onupgradeneeded = function () {
    console.log('Database created/upgraded successfully');
    const db = request.result;
    const store = db.createObjectStore('repos', { keyPath: 'url' });
    store.createIndex('order', ['order'], { unique: true });
  };
  request.onsuccess = async function () {
    const db = request.result;
    const transaction = db.transaction('repos', mode);
    const store = transaction.objectStore('repos');
    success_fn({ db, transaction, store });
    transaction.oncomplete = function () {
      db.close();
    };
  };
}
function dbv1_get(url) {
  return new Promise((resolve, reject) => {
    dbv1_open('readonly', async function ({ store }) {
      const getQuery = store.get(url);
      getQuery.onerror = function () {
        reject();
      };
      getQuery.onsuccess = function () {
        resolve(getQuery.result);
      };
    });
  });
}
function dbv1_getAll() {
  return new Promise((resolve, reject) => {
    dbv1_open('readonly', async function ({ store }) {
      const getQuery = store.getAll();
      getQuery.onerror = function () {
        reject();
      };
      getQuery.onsuccess = function () {
        resolve(getQuery.result);
      };
    });
  });
}
function dbv1_getOrdered() {
  return new Promise((resolve, reject) => {
    dbv1_open('readonly', async function ({ store }) {
      const orderIndex = store.index('order');
      const getQuery = orderIndex.getAll();
      getQuery.onerror = function () {
        reject();
      };
      getQuery.onsuccess = function () {
        resolve(getQuery.result);
      };
    });
  });
}
function dbv1_getAllKeys() {
  return new Promise((resolve, reject) => {
    dbv1_open('readonly', async function ({ store }) {
      const getQuery = store.getAllKeys();
      getQuery.onerror = function () {
        reject();
      };
      getQuery.onsuccess = function () {
        resolve(getQuery.result);
      };
    });
  });
}
function dbv1_add(url) {
  return new Promise((resolve) => {
    dbv1_open('readwrite', async function ({ store }) {
      const orderIndex = store.index('order');
      const cursorQuery = orderIndex.openCursor(null, 'prev');
      cursorQuery.onerror = function () {
        console.log('Error', cursorQuery.error);
        resolve(false);
      };
      cursorQuery.onsuccess = function () {
        const cursor = cursorQuery.result;
        const row = cursor?.value;
        const order = row ? row.order + 1 : 0;
        const addQuery = store.add({ url, order });
        addQuery.onerror = function () {
          console.log('Error', addQuery.error);
          resolve(false);
        };
        addQuery.onsuccess = function () {
          resolve(true);
        };
      };
    });
  });
}
function dbv1_delete(url) {
  return new Promise((resolve) => {
    dbv1_open('readwrite', async function ({ store }) {
      const deleteQuery = store.delete(url);
      deleteQuery.onerror = function () {
        console.log('Error', deleteQuery.error);
        resolve(false);
      };
      deleteQuery.onsuccess = function () {
        resolve(true);
      };
    });
  });
}
function dbv1_put(url, order) {
  return new Promise((resolve) => {
    dbv1_open('readwrite', async function ({ store }) {
      const putQuery = store.put({ url, order });
      putQuery.onerror = function () {
        console.log('Error', putQuery.error);
        resolve(false);
      };
      putQuery.onsuccess = function () {
        resolve(true);
      };
    });
  });
}
function dbv1_raise(url) {
  dbv1_open('readwrite', async function ({ store }) {
    const currentQuery = store.get(url);
    currentQuery.onerror = function () {
      console.log('Error', currentQuery.error);
    };
    currentQuery.onsuccess = function () {
      const current = currentQuery.result;
      const orderIndex = store.index('order');
      const orderCursorQuery = orderIndex.openCursor(null, 'prev');
      let found = false;
      orderCursorQuery.onsuccess = function () {
        const cursor = orderCursorQuery.result;
        if (cursor) {
          const row = cursor.value;
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
function dbv1_lower(url) {
  dbv1_open('readwrite', async function ({ store }) {
    const currentQuery = store.get(url);
    currentQuery.onerror = function () {
      console.log('Error', currentQuery.error);
    };
    currentQuery.onsuccess = function () {
      const current = currentQuery.result;
      const orderIndex = store.index('order');
      const orderCursorQuery = orderIndex.openCursor(null, 'next');
      let found = false;
      orderCursorQuery.onsuccess = function () {
        const cursor = orderCursorQuery.result;
        if (cursor) {
          const row = cursor.value;
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
export {};
