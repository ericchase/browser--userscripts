// ==UserScript==
// @name        google.com: Clean Up Search Results
// @author      ericchase
// @namespace   ericchase
// @match       *://*.google.com/*
// @version     2.0.3
// @description 8/11/2022, 1:39:30 AM
// @run-at      document-start
// @grant       none
// @homepageURL https://github.com/ericchase/browser--userscripts
// ==/UserScript==

const SELECTOR = {
  SEARCH_RESULT_SECTION: '#rso',
  SEARCH_RESULT_ITEM: 'div.g',
  SEARCH_RESULT_TITLE: 'a > h3',
  SEARCH_RESULT_SECTION_TITLE: 'h3 > span',
  SEARCH_RESULT_SKIPPABLE: 'g-tray-header, g-section-with-header',
  BOTTOM_SECTION: '#botstuff',
  NAVIGATION: 'div[role="navigation"]',
};

const SKIPPABLE_SECTIONS = ['People also ask'];

// User Defined Function

function filterSearchResult(element) {
  const SKIPPABLE_PHRASES = ['best'];

  const title = element.querySelector(SELECTOR.SEARCH_RESULT_TITLE)?.textContent.toLowerCase();
  if (title) {
    for (const phrase of SKIPPABLE_PHRASES) {
      if (title.includes(phrase)) {
        element.style.opacity = 0.25;
      }
    }
  }
}

// Source Code

function watchForElement({ selector, root, subtree }, fn) {
  root ??= document;
  if (typeof selector !== 'string') return;
  new MutationObserver(function (records, observer) {
    for (const record of records) {
      if (record?.addedNodes?.length === 0) continue;
      for (const node of record?.addedNodes) {
        if (Object.getPrototypeOf(Object.getPrototypeOf(node))?.constructor?.name !== 'HTMLElement') continue;
        if (node?.matches?.(selector) === false) continue;
        if (fn?.(node) === false) {
          observer.disconnect();
          return;
        }
      }
    }
  }).observe(root, { childList: true, subtree });
}

function watchForChildren({ selector, root }, fn) {
  watchForElement({ selector, root, subtree: false }, fn);
}

function watchForDescendants({ selector, root }, fn) {
  watchForElement({ selector, root, subtree: true }, fn);
}

function get(selector) {
  return new Promise(async function (resolve) {
    watchForDescendants({ selector }, function (element) {
      resolve(element);
      return false;
    });
  });
}

function hide(element) {
  element.hidden = true;
  element.style.display = 'none';
}

// result -> result root
const mapOfResultsToRoots = new Map();
const setOfRootsToSkip = new Set();
function isSubSearchResult(element) {
  for (const [result] of mapOfResultsToRoots) if (result.contains(element)) return true;
  return false;
}
function isSkippableRoot(root, result) {
  if (setOfRootsToSkip.has(root)) return true;
  if (setOfRootsToSkip.has(mapOfResultsToRoots.get(result))) return true;
  return false;
}
function processSectionTitle(root, title_element) {
  if (SKIPPABLE_SECTIONS.includes(title_element?.textContent)) {
    setOfRootsToSkip.add(root);
    for (const [result, root] of mapOfResultsToRoots) {
      if (setOfRootsToSkip.has(root)) {
        hide(result);
      }
    }
  }
}
function processSearchResultRoot(rso, root) {
  hide(root);
  // Look for skippable sections
  watchForDescendants({ selector: SELECTOR.SEARCH_RESULT_SECTION_TITLE, root }, function (child) {
    processSectionTitle(root, child);
  });
  for (const child of root.querySelectorAll(SELECTOR.SEARCH_RESULT_SECTION_TITLE)) {
    processSectionTitle(root, child);
  }
  // Look for search results
  watchForDescendants({ selector: SELECTOR.SEARCH_RESULT_ITEM, root }, function (child) {
    if (mapOfResultsToRoots.has(child)) return;
    if (isSubSearchResult(child)) return;
    if (isSkippableRoot(root, child)) return;
    mapOfResultsToRoots.set(child, root);
    rso.appendChild(child);
  });
  for (const child of root.querySelectorAll(SELECTOR.SEARCH_RESULT_ITEM)) {
    if (mapOfResultsToRoots.has(child)) continue;
    if (isSubSearchResult(child)) continue;
    if (isSkippableRoot(root, child)) continue;
    mapOfResultsToRoots.set(child, root);
    rso.appendChild(child);
  }
}

function catchSectionsToIgnore(root) {
  watchForDescendants({ selector: SELECTOR.SEARCH_RESULT_SKIPPABLE, root }, function () {
    hide(root);
    return false;
  });
  if (root.querySelector(SELECTOR.SEARCH_RESULT_SKIPPABLE)) {
    hide(root);
  }
}

get(SELECTOR.SEARCH_RESULT_SECTION).then((rso) => {
  watchForChildren({ selector: '*', root: rso }, function (child) {
    if (child.matches(SELECTOR.SEARCH_RESULT_ITEM)) {
      filterSearchResult(child);
      catchSectionsToIgnore(child);
    } else {
      processSearchResultRoot(rso, child);
    }
  });
  for (const child of [...rso.children]) {
    processSearchResultRoot(rso, child);
  }
});

function processBotStuffRoot(botstuff, root) {
  hide(root);
  watchForDescendants({ selector: SELECTOR.NAVIGATION, root }, function (child) {
    botstuff.appendChild(child);
  });
  for (const child of root.querySelectorAll(SELECTOR.NAVIGATION)) {
    botstuff.appendChild(child);
  }
}

get(SELECTOR.BOTTOM_SECTION).then((botstuff) => {
  watchForChildren({ selector: '*', root: botstuff }, function (child) {
    if (child.matches(SELECTOR.NAVIGATION)) {
    } else {
      processBotStuffRoot(botstuff, child);
    }
  });
  for (const child of [...botstuff.children]) {
    processBotStuffRoot(botstuff, child);
  }
});
