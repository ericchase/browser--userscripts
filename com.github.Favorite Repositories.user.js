// ==UserScript==
// @name        github.com: Favorite Repositories
// @author      ericchase
// @namespace   ericchase
// @match       https://github.com/*
// @version     1.0.1
// @description 3/12/2024, 2:56:09 AM
// @run-at      document-start
// @grant       none
// @homepageURL https://github.com/ericchase/browser--userscripts
// ==/UserScript==

async function main() {
  if (window.location.href === 'https://github.com/') {
    // <div class="dashboard-sidebar">
    const el_Sidebar = await PollForElement(document, '.dashboard-sidebar', 100);
    // <div class="Details js-repos-container " data-repository-hovercards-enabled="" role="navigation" aria-label="Repositories">
    const el_Repositories = await PollForElement(el_Sidebar, '[aria-label="Repositories"]', 100);
    // <div class="js-repos-container">
    const el_JSReposContainer = await PollForElement(el_Repositories, '.js-repos-container', 100);

    const el_Top_Title = el_JSReposContainer.children[0];
    const el_Top_Search = el_JSReposContainer.children[1];
    const el_Top_Repos = el_JSReposContainer.children[2];
    const el_Top_ShowMore = el_JSReposContainer.children[3];

    // Title
    const el_Favorites_Title = el_Top_Title.cloneNode();
    {
      const h2 = el_Top_Title.children[0].cloneNode();
      h2.textContent = 'Favorite Repositories';
      el_Favorites_Title.appendChild(h2);
    }
    el_JSReposContainer.insertBefore(el_Favorites_Title, el_Top_Title);

    // Repo List
    const el_Favorites_Repos = el_Top_Repos.cloneNode();
    for (const { url } of await dbv1_getOrdered()) {
      const item = await CloneRepoListItem(el_Top_Repos, url);
      el_Favorites_Repos.appendChild(item);
    }
    el_JSReposContainer.insertBefore(el_Favorites_Repos, el_Top_Title);

    // Margin
    const el_Favorites_Margin = document.createElement('div');
    el_Favorites_Margin.classList.add('mt-3');
    el_JSReposContainer.insertBefore(el_Favorites_Margin, el_Top_Title);

    // Remove Top Repositories
    el_Top_Title.remove();
    el_Top_Search.remove();
    el_Top_Repos.remove();
    el_Top_ShowMore.remove();
  } else {
    const repoUrl = window.location.href;
    // <div id="repository-details-container" data-turbo-replace="">
    //   <ul class="pagehead-actions flex-shrink-0 d-none d-md-inline" style="padding: 2px 0;">
    const el_Buttons = await PollForElement(document, '#repository-details-container>ul', 100);
    {
      // <li>
      //   <button class="btn-sm btn">Favorite</button>
      // </li>
      const li = document.createElement('li');
      const button = document.createElement('button');
      button.classList.add('btn-sm');
      button.classList.add('btn');
      if (await dbv1_get(repoUrl)) {
        button.textContent = 'Unfavorite';
      } else {
        button.textContent = 'Favorite';
      }
      button.addEventListener('click', async () => {
        try {
          if (await dbv1_get(repoUrl)) {
            console.log('has');
            if (await dbv1_delete(repoUrl)) {
              button.textContent = 'Favorite';
            }
          } else {
            console.log("don't has");
            if (await dbv1_add(repoUrl)) {
              button.textContent = 'Unfavorite';
            }
          }
        } catch (error) {}
      });
      li.append(button);
      el_Buttons.append(li);
    }
  }
}
main();

/**
 * @param {Element} elList
 * @param {string} repoUrl
 */
async function CloneRepoListItem(elList, repoUrl) {
  const el_ChildClone = elList.children[0].cloneNode(true);
  if (el_ChildClone instanceof Element) {
    el_ChildClone.classList.remove('public');
    el_ChildClone.classList.remove('private');

    const aTags = el_ChildClone.querySelectorAll('a');
    // remove attributes
    for (const aTag of aTags) {
      for (const name of aTag.getAttributeNames()) {
        if (name !== 'class') {
          aTag.removeAttribute(name);
        }
      }
    }

    const urlParts = repoUrl.split('/');
    const userName = urlParts.at(-2) ?? '';
    const repoName = urlParts.at(-1) ?? '';

    // User Image
    aTags[0].href = repoUrl;
    const image = aTags[0].querySelectorAll('img')[0];
    image.src = await getUserAvatar(userName);
    image.alt = '';

    // Repo URL
    aTags[1].href = repoUrl;
    // User Name
    aTags[1].childNodes[0].textContent = userName;
    // Slash
    aTags[1].childNodes[1];
    // Repo Name
    aTags[1].childNodes[2].textContent = repoName;

    if (el_ChildClone.firstElementChild) {
      {
        // Raise
        const el = document.createElement('a');
        el.href = '#';
        el.classList.add('ml-1');
        el.textContent = '↑';
        el.addEventListener('click', (ev) => {
          ev.preventDefault();
          dbv1_raise(repoUrl);
          if (el_ChildClone.parentElement && el_ChildClone.previousElementSibling) {
            el_ChildClone.parentElement.insertBefore(el_ChildClone, el_ChildClone.previousElementSibling);
          }
        });
        el_ChildClone.firstElementChild.appendChild(el);
      }
      {
        // Lower
        const el = document.createElement('a');
        el.href = '#';
        el.classList.add('ml-1');
        el.textContent = '↓';
        el.addEventListener('click', (ev) => {
          ev.preventDefault();
          dbv1_lower(repoUrl);
          if (el_ChildClone.parentElement && el_ChildClone.nextElementSibling) {
            el_ChildClone.parentElement.insertBefore(el_ChildClone.nextElementSibling, el_ChildClone);
          }
        });
        el_ChildClone.firstElementChild.appendChild(el);
      }
      {
        // Delete
        const el = document.createElement('a');
        el.href = '#';
        el.classList.add('ml-1');
        el.textContent = '⨯';
        el.addEventListener('click', (ev) => {
          ev.preventDefault();
          dbv1_delete(repoUrl);
          el_ChildClone.remove();
        });
        el_ChildClone.firstElementChild.appendChild(el);
      }
    }
  }
  return el_ChildClone;
}

/** @type {Map<string,string>} */
const avatarCache = new Map();
/**
 * @param {string} userName
 */
async function getUserAvatar(userName) {
  if (!avatarCache.has(userName)) {
    const userUrl = 'https://github.com/' + userName;
    const response = await fetch(userUrl);
    const html = await response.text();
    const start = html.indexOf('https://avatars.githubusercontent.com/u/');
    const end = html.indexOf('?', start);
    const avatarUrl = html.substring(start, end) + '?s=16&v=4';
    avatarCache.set(userName, avatarUrl);
  }
  return avatarCache.get(userName) ?? '';
}

/**
 * @param {Document|Element} root
 * @param {string} query
 * @param {number} ms
 * @param {number} timeout
 * @return {Promise<HTMLElement>}
 */
function PollForElement(root, query, ms, timeout = 10000) {
  return new Promise((resolve, reject) => {
    let abort = false;
    const abortid = setTimeout(() => {
      console.log('poll timeout:', query);
      abort = true;
    }, timeout);
    (function search() {
      for (const el of root.querySelectorAll(query)) {
        if (el instanceof HTMLElement /*&& el.style.display !== 'none'*/) {
          clearTimeout(abortid);
          return resolve(el);
        }
      }
      if (abort === false) {
        setTimeout(search, ms);
      } else {
        return reject();
      }
    })();
  });
}

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
