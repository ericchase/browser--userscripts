// ==UserScript==
// @name        reddit.com: Stop Video Autoplay
// @author      ericchase
// @namespace   ericchase
// @match       https://www.reddit.com/r/*
// @version     1.0.0
// @description 8/4/2024, 1:55:25 PM
// @run-at      document-start
// @grant       none
// @homepageURL https://github.com/ericchase/browser--userscripts
// ==/UserScript==

(() => {
  observeDocument(mainCallback);
})();

function playHandler(event) {
  const controls = event.target.nextElementSibling?.shadowRoot?.querySelector('.controls');
  if (controls instanceof HTMLElement) {
    event.target.removeEventListener('play', playHandler);
    controls.click();
  }
}

// Most of the videos are being caught with "attributes" type mutations.

const videoSet = new Set();
/**
 * @param {MutationRecord[]} mutationRecords
 * @param {MutationObserver} mutationObserver
 */
function mainCallback(mutationRecords, mutationObserver) {
  for (const record of mutationRecords) {
    if (record.target instanceof HTMLElement) {
      for (const { shadowRoot } of record.target.querySelectorAll('*')) {
        if (shadowRoot instanceof ShadowRoot) {
          for (const video of shadowRoot.querySelectorAll('video')) {
            if (!videoSet.has(video)) {
              videoSet.add(video);
              video.addEventListener('play', playHandler);
            }
          }
        }
      }
    }
  }
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
  mutationObserver.observe(document.documentElement, { subtree: true, childList: true, attributes: true, characterData: true });
}
