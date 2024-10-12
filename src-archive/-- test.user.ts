import { ElementAddedObserver } from '../src/lib/ericchase/Platform/Web/DOM/MutationObserver/ElementAdded.js';

const header = `
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
`;

const favoriteSelector = '.favorite-heart';
const nextPageSelector = '.pagination-btn:last-child';

function ClickFavoritesOnPage() {
  return new Promise<void>((resolve) => {
    let count = 0;
    new ElementAddedObserver({ selector: favoriteSelector }) //
      .subscribe((el, unsubscribe) => {
        el.click();
        count++;
        if (count >= 24) {
          unsubscribe();
          resolve();
        }
      });
  });
}

new ElementAddedObserver({ selector: nextPageSelector }) //
  .subscribe(async (el, unsubscribe) => {
    unsubscribe();
    let count = 0;
    while (count < 38) {
      await ClickFavoritesOnPage();
      el.click();
      count++;
    }
  });
