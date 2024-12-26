const header = `
// ==UserScript==
// @name        studiokhimera.com: ??
// @author      ericchase
// @namespace   ericchase
// @match       https://uberquest.studiokhimera.com/comic/page/*
// @version     1.0.0
// @description 10/13/2024, 5:44:12 PM
// @run-at      document-start
// @grant       none
// @homepageURL https://github.com/ericchase/browser--userscripts
// ==/UserScript==
`;

import { ElementAddedObserver } from './lib/ericchase/Platform/Web/DOM/MutationObserver/ElementAdded.js';

const url_set = new Set<string>();
console.log(url_set);
new ElementAddedObserver({ selector: 'a > img[src*="/next-hover.png"]' }).subscribe((next, unsubscribe) => {
  if (next instanceof HTMLImageElement) {
    unsubscribe();
    new ElementAddedObserver({ selector: 'img' }).subscribe((element, unsubscribe) => {
      if (element instanceof HTMLImageElement) {
        if (element.src.endsWith('.webp') && url_set.has(element.src) === false) {
          url_set.add(element.src);
          // SaveUrl(element.src, `${SanitizeFileName(window.location.href)}.webp`);
        }
      }
    });
    setInterval(() => {
      next.click();
    }, 1000);
  }
});
