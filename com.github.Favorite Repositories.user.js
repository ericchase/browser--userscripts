// ==UserScript==
// @name        github.com: Favorite Repositories
// @author      ericchase
// @namespace   ericchase
// @match       https://github.com/*
// @version     1.1.1
// @description 3/12/2024, 2:56:09 AM
// @run-at      document-start
// @grant       none
// @homepageURL https://github.com/ericchase/browser--userscripts
// ==/UserScript==

const getOrderedListTask = dbv1_getOrdered();
/** @type {Map<string,string>} */
const avatarCache = new Map();
/** @type {Set<HTMLElement>} */
const processedSet = new Set();

/** @type {HTMLElement[]} */
const undoElements = [];
/** @type {(()=>void)[]} */
const undoList = [];

const mainQuery = 'div[class="js-repos-container"]';
const alternateQuery = '#repository-details-container>ul';

(function () {
  if (window.location.href === 'https://github.com/') {
    for (const element of document.documentElement.querySelectorAll(mainQuery) ?? []) {
      if (element instanceof HTMLElement) {
        setupFavoritesList(element);
      }
    }
    observeDocument(mainCallback);
  } else {
    for (const element of document.documentElement.querySelectorAll(alternateQuery) ?? []) {
      if (element instanceof HTMLElement) {
        addFavoriteButton(element);
        return;
      }
    }
    observeDocument(alternateCallback);
  }
})();

/**
 * @param {MutationRecord[]} mutationRecords
 * @param {MutationObserver} mutationObserver
 */
function mainCallback(mutationRecords, mutationObserver) {
  for (const record of mutationRecords) {
    for (const node of record.addedNodes) {
      if (node instanceof HTMLElement) {
        if (node.matches(mainQuery)) {
          setupFavoritesList(node);
        }
        for (const element of node.querySelectorAll(mainQuery) ?? []) {
          if (element instanceof HTMLElement) {
            setupFavoritesList(element);
          }
        }
      }
    }
  }
}

/**
 * @param {MutationRecord[]} mutationRecords
 * @param {MutationObserver} mutationObserver
 */
function alternateCallback(mutationRecords, mutationObserver) {
  for (const record of mutationRecords) {
    for (const node of record.addedNodes) {
      if (node instanceof HTMLElement) {
        if (node.matches(alternateQuery)) {
          addFavoriteButton(node);
          return;
        }
        for (const element of node.querySelectorAll(alternateQuery) ?? []) {
          if (element instanceof HTMLElement) {
            addFavoriteButton(element);
            return;
          }
        }
      }
    }
  }
}

/**
 * @param {HTMLElement} buttonList
 */
async function addFavoriteButton(buttonList) {
  if (processedSet.has(buttonList) === false) {
    processedSet.add(buttonList);

    const li = createElement('li');
    buttonList.append(li);
    const button = createElement('button', { classList: ['btn-sm', 'btn'] });
    li.append(button);

    const repoUrl = window.location.href;

    if (await dbv1_get(repoUrl)) {
      button.textContent = 'Unfavorite';
    } else {
      button.textContent = 'Favorite';
    }
    button.addEventListener('click', async () => {
      try {
        if (await dbv1_get(repoUrl)) {
          if (await dbv1_delete(repoUrl)) {
            button.textContent = 'Favorite';
          }
        } else {
          if (await dbv1_add(repoUrl)) {
            button.textContent = 'Unfavorite';
          }
        }
      } catch (error) {}
    });
  }
}

/**
 * @param {HTMLElement} repositoryList
 */
async function setupFavoritesList(repositoryList) {
  if (processedSet.has(repositoryList) === false) {
    processedSet.add(repositoryList);
    const newSection = createFavoritesSection();
    repositoryList.parentElement?.insertBefore(newSection._element, repositoryList);
    // originalList.toggleAttribute('hidden', true);
    populateFavoritesList(newSection.list);
  }
}

/**
 * @param {HTMLUListElement} list
 */
async function populateFavoritesList(list) {
  for (const { url } of await getOrderedListTask) {
    const urlParts = url.split('/');
    const userName = urlParts.at(-2) ?? '';
    const repoName = urlParts.at(-1) ?? '';
    const item = createRepositoryListItem(userName, repoName);
    list.appendChild(item);
    addDatabaseOperations(list, item, url);
    // makeDraggable(item);
  }
}

/**
 * @param {HTMLUListElement} list
 * @param {HTMLLIElement} item
 * @param {string} url
 */
async function addDatabaseOperations(list, item, url) {
  function _raise() {
    dbv1_raise(url);
    if (item.parentElement && item.previousElementSibling) {
      item.parentElement.insertBefore(item, item.previousElementSibling);
    }
  }
  function _lower() {
    dbv1_lower(url);
    if (item.parentElement && item.nextElementSibling) {
      item.parentElement.insertBefore(item.nextElementSibling, item);
    }
  }

  if (item.firstElementChild) {
    // Raise
    const raiseA = createElement('a', { textContent: '↑' });
    raiseA.href = '#';
    raiseA.addEventListener('click', (ev) => {
      ev.preventDefault();
      addUndoHistory(_lower);
      _raise();
    });

    // Lower
    const lowerA = createElement('a', { textContent: '↓' });
    lowerA.href = '#';
    lowerA.addEventListener('click', (ev) => {
      ev.preventDefault();
      addUndoHistory(_raise);
      _lower();
    });

    const div = createElement('div', { classList: ['mr-2', 'd-flex', 'flex-items-center'] });
    div.append(raiseA, lowerA);
    item.firstElementChild.prepend(div);

    // Delete
    const deleteA = createElement('a', { classList: ['ml-1'], textContent: '⨯' });
    deleteA.href = '#';
    deleteA.addEventListener('click', async (ev) => {
      ev.preventDefault();
      const { order } = await dbv1_get(url);
      const nextElement = item.nextElementSibling;
      addUndoHistory(() => {
        dbv1_put(url, order);
        list.insertBefore(item, nextElement);
      });
      dbv1_delete(url);
      item.remove();
    });

    item.firstElementChild.appendChild(deleteA);
  }
}

// /**
//  * @param {HTMLLIElement} item
//  */
// function makeDraggable(item) {
//   if (item.firstElementChild) {
//     const div = createElement('div', { classList: ['mr-2', 'd-flex', 'flex-items-center'] });
//     const svg = new DOMParser().parseFromString(
//       `<svg viewBox="0 0 25 45" height="1em" xmlns="http://www.w3.org/2000/svg">
//       <circle cx="5"  cy="10" r="3"></circle>
//       <circle cx="5"  cy="25" r="3"></circle>
//       <circle cx="5"  cy="40" r="3"></circle>
//       <circle cx="20" cy="10" r="3"></circle>
//       <circle cx="20" cy="25" r="3"></circle>
//       <circle cx="20" cy="40" r="3"></circle>
//     </svg>`,
//       'text/html',
//     ).firstElementChild;
//     if (svg) {
//       div.append(svg);
//     }
//     item.firstElementChild.prepend(div);
//     div.setAttribute('draggable', 'true');
//     div.addEventListener('dragstart', (ev) => {
//       if (ev.dataTransfer) {
//         ev.dataTransfer.effectAllowed = 'move';
//       }
//     });
//   }
// }

function createFavoritesSection() {
  const _element = createElement('div', { classList: ['js-repos-container'] });

  const div = createElement('div', { classList: ['mr-2', 'd-flex', 'flex-items-center'] });
  const title = createElement('h2', { classList: ['f5'], textContent: 'Favorite Repositories' });
  const undo = createElement('a', { classList: ['ml-2'], textContent: 'undo' });
  undo.toggleAttribute('hidden', true);
  undo.href = '#';
  undo.addEventListener('click', (ev) => {
    ev.preventDefault();
    undoOnce();
  });
  div.append(title, undo);
  undoElements.push(undo);

  const list = createElement('ul', { classList: ['list-style-none'] });
  const margin = createElement('div', { classList: ['mt-3'] });
  _element.appendChild(div);
  _element.appendChild(list);
  _element.appendChild(margin);
  return { _element, title, list, margin };
}

/**
 * @param {()=>void} callback
 */
function addUndoHistory(callback) {
  undoList.push(callback);
  if (undoList.length > 0) {
    for (const undo of undoElements) {
      undo.toggleAttribute('hidden', false);
    }
  }
}
function undoOnce() {
  if (undoList.length > 0) {
    const callback = undoList.pop();
    if (callback) {
      callback();
    }
  }
  if (undoList.length === 0) {
    for (const undo of undoElements) {
      undo.toggleAttribute('hidden', true);
    }
  }
}

/**
 * @param {string} userName
 * @param {string} repoName
 */
function createRepositoryListItem(userName, repoName) {
  const listItem = createElement('li', { classList: ['source'] });
  const containerDiv = createElement('div', { classList: ['width-full', 'd-flex', 'mt-2'] });
  listItem.appendChild(containerDiv);
  const pictureA = createElement('a', { classList: ['mr-2', 'd-flex', 'flex-items-center'] });
  containerDiv.appendChild(pictureA);
  pictureA.href = `/${userName}/${repoName}`;
  const pictureImg = createElement('img', { classList: ['avatar', 'avatar-user', 'avatar-small', 'circle'] });
  pictureA.appendChild(pictureImg);
  pictureImg.setAttribute('width', '16');
  pictureImg.setAttribute('height', '16');
  pictureImg.setAttribute('alt', repoName);
  getUserAvatar(userName, pictureImg);
  const nameDiv = createElement('div', { classList: ['wb-break-word'] });
  containerDiv.appendChild(nameDiv);
  const nameA = createElement('a', { classList: ['color-fg-default', 'lh-0', 'mb-2', 'markdown-title'] });
  nameDiv.appendChild(nameA);
  nameA.href = `/${userName}/${repoName}`;
  nameA.append(document.createTextNode(userName));
  nameA.appendChild(createElement('span', { classList: ['color-fg-muted'], textContent: '/' }));
  nameA.append(document.createTextNode(repoName));
  return listItem;
}

/**
 * @param {string} userName
 * @param {HTMLImageElement} img
 */
async function getUserAvatar(userName, img) {
  if (!avatarCache.has(userName)) {
    const userUrl = 'https://github.com/' + userName;
    const response = await fetch(userUrl);
    const html = await response.text();
    const start = html.indexOf('https://avatars.githubusercontent.com/u/');
    const end = html.indexOf('?', start);
    const avatarUrl = html.substring(start, end) + '?s=16&v=4';
    avatarCache.set(userName, avatarUrl);
  }
  img.src = avatarCache.get(userName) ?? '';
}

//
//
//
//
//
//
//
//
//

/**
 * @param {MutationCallback} callback
 */
function observeDocument(callback) {
  const mutationObserver = new MutationObserver(callback);
  mutationObserver.observe(document.documentElement, { subtree: true, childList: true });
}

/**
 * @template {keyof HTMLElementTagNameMap} K
 * @param {K} tag
 * @param {object} options
 * @param {string[]=} options.classList
 * @param {string=} options.textContent
 */
function createElement(tag, options = {}) {
  const el = document.createElement(tag);
  el.classList.add('INJECTED');
  if (options.classList) {
    el.classList.add(...options.classList);
  }
  if (options.textContent) {
    el.textContent = options.textContent;
  }
  return el;
}

//
//
//
//
//
//
//
//
//
// INDEXEDDB
// https://github.com/alexeagleson/template-indexeddb

function getIndexedDB() {
  // This works on all devices/browsers, and uses IndexedDBShim as a final fallback
  // @ts-ignore
  const _ = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB;
  if (!_) throw 'undefined: indexedDB';
  return _;
}

/**
 * @typedef {object} DBRow
 * @property {string} url
 * @property {number} order
 */

/**
 * @param {'readonly'|'readwrite'} mode
 * @param {(args:{db:IDBDatabase;transaction:IDBTransaction;store:IDBObjectStore})=>Promise<void>} success_fn
 */
function dbv1_open(mode, success_fn) {
  const request = getIndexedDB().open('GithubFavorites', 1);

  request.onerror = function (/**@type{Event}*/ ev) {
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

/**
 * @param {string} url
 * @return {Promise<DBRow>}
 */
function dbv1_get(url) {
  return new Promise((resolve, reject) => {
    dbv1_open('readonly', async function ({ store }) {
      /** @type {IDBRequest<DBRow>} */
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

/**
 * @return {Promise<DBRow[]>}
 */
function dbv1_getAll() {
  return new Promise((resolve, reject) => {
    dbv1_open('readonly', async function ({ store }) {
      /** @type {IDBRequest<DBRow[]>} */
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

/**
 * @return {Promise<DBRow[]>}
 */
function dbv1_getOrdered() {
  return new Promise((resolve, reject) => {
    dbv1_open('readonly', async function ({ store }) {
      const orderIndex = store.index('order');
      /** @type {IDBRequest<DBRow[]>} */
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

/**
 * @param {string} url
 * @returns {Promise<boolean>}
 */
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
        /** @type {DBRow} */
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

/**
 * @param {string} url
 * @returns {Promise<boolean>}
 */
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

/**
 * @param {string} url
 * @param {number} order
 * @returns {Promise<boolean>}
 */
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

/**
 * @param {string} url
 */
function dbv1_raise(url) {
  dbv1_open('readwrite', async function ({ store }) {
    const currentQuery = store.get(url);
    currentQuery.onerror = function () {
      console.log('Error', currentQuery.error);
    };
    currentQuery.onsuccess = function () {
      /** @type {DBRow} */
      const current = currentQuery.result;
      const orderIndex = store.index('order');
      const orderCursorQuery = orderIndex.openCursor(null, 'prev');
      let found = false;
      orderCursorQuery.onsuccess = function () {
        const cursor = orderCursorQuery.result;
        if (cursor) {
          /** @type {DBRow} */
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

/**
 * @param {string} url
 */
function dbv1_lower(url) {
  dbv1_open('readwrite', async function ({ store }) {
    const currentQuery = store.get(url);
    currentQuery.onerror = function () {
      console.log('Error', currentQuery.error);
    };
    currentQuery.onsuccess = function () {
      /** @type {DBRow} */
      const current = currentQuery.result;
      const orderIndex = store.index('order');
      const orderCursorQuery = orderIndex.openCursor(null, 'next');
      let found = false;
      orderCursorQuery.onsuccess = function () {
        const cursor = orderCursorQuery.result;
        if (cursor) {
          /** @type {DBRow} */
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
