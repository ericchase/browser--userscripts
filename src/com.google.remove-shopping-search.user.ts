const header = `
// ==UserScript==
// @name        google.com: ??
// @author      ericchase
// @namespace   ericchase
// @match       https://www.google.com/search*
// @version     1.0.0
// @description 11/22/2024, 7:59:08 PM
// @run-at      document-start
// @grant       none
// @homepageURL https://github.com/ericchase/browser--userscripts
// ==/UserScript==
`;

import { ElementAddedObserver } from './lib/ericchase/Platform/Web/DOM/MutationObserver/ElementAdded.js';

async function main() {
  new ElementAddedObserver({
    selector: 'div[role="listitem"]',
  }).subscribe(async (element) => {
    if (element instanceof HTMLDivElement) {
      if (
        element.textContent?.includes('Shopping') || //
        element.textContent?.includes('News') ||
        element.textContent?.includes('Forums') ||
        element.textContent?.includes('Web')
      ) {
        element.remove();
      }
    }
  });
}

main();
