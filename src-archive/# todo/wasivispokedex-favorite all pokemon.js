// ==UserScript==
// @name        wasivispokedex.netlify.app: ??
// @author      ericchase
// @namespace   ericchase
// @match       https://wasivispokedex.netlify.app/*
// @version     1.0.0
// @description 8/31/2024, 9:52:16 AM
// @run-at      document-start
// @grant       none
// @homepageURL https://github.com/ericchase/browser--userscripts
// ==/UserScript==

// src/lib/ericchase/Platform/Web/DOM/MutationObserver/ElementAdded.ts
class ElementAddedObserver {
  constructor({ source = document.documentElement, options = { subtree: true }, selector, includeExistingElements = true }) {
    this.mutationObserver = new MutationObserver((mutationRecords) => {
      for (const record of mutationRecords) {
        if (record.target instanceof Element && record.target.matches(selector)) {
          this.send(record.target);
        }
        const treeWalker = document.createTreeWalker(record.target, NodeFilter.SHOW_ELEMENT);
        while (treeWalker.nextNode()) {
          if (treeWalker.currentNode.matches(selector)) {
            this.send(treeWalker.currentNode);
          }
        }
      }
    });
    this.mutationObserver.observe(source, { childList: true, subtree: options.subtree ?? true });
    if (includeExistingElements === true) {
      const treeWalker = document.createTreeWalker(document, NodeFilter.SHOW_ELEMENT);
      while (treeWalker.nextNode()) {
        if (treeWalker.currentNode.matches(selector)) {
          this.send(treeWalker.currentNode);
        }
      }
    }
  }
  disconnect() {
    this.mutationObserver.disconnect();
    for (const callback of this.subscriptionSet) {
      this.subscriptionSet.delete(callback);
    }
  }
  subscribe(callback) {
    this.subscriptionSet.add(callback);
    let abort = false;
    for (const element of this.matchSet) {
      callback(element, () => {
        this.subscriptionSet.delete(callback);
        abort = true;
      });
      if (abort) return () => {};
    }
    return () => {
      this.subscriptionSet.delete(callback);
    };
  }
  mutationObserver;
  matchSet = new Set();
  subscriptionSet = new Set();
  send(element) {
    if (!this.matchSet.has(element)) {
      this.matchSet.add(element);
      for (const callback of this.subscriptionSet) {
        callback(element, () => {
          this.subscriptionSet.delete(callback);
        });
      }
    }
  }
}

// src/-- test.user.ts
function ClickFavoritesOnPage() {
  return new Promise((resolve) => {
    let count = 0;
    new ElementAddedObserver({ selector: favoriteSelector }).subscribe((el, unsubscribe) => {
      el.click();
      count++;
      if (count >= 24) {
        unsubscribe();
        resolve();
      }
    });
  });
}
var favoriteSelector = '.favorite-heart';
var nextPageSelector = '.pagination-btn:last-child';
new ElementAddedObserver({ selector: nextPageSelector }).subscribe(async (el, unsubscribe) => {
  unsubscribe();
  let count = 0;
  while (count < 38) {
    await ClickFavoritesOnPage();
    el.click();
    count++;
  }
});
