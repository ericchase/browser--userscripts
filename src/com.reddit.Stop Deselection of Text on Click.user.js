// ==UserScript==
// @name        reddit.com: Stop Deselection of Text on Click
// @author      ericchase
// @namespace   ericchase
// @match       https://www.reddit.com/*
// @version     1.0.0
// @description 11/15/2023, 7:13:46 PM
// @run-at      document-start
// @grant       none
// @homepageURL https://github.com/ericchase/browser--userscripts
// ==/UserScript==

// pretty straightforward, just works

document.addEventListener('mousedown', function (evt) {
  evt.stopImmediatePropagation();
});
