const header = `
// ==UserScript==
// @name        org.p5play: Remove Login Modal
// @author      ericchase
// @namespace   ericchase
// @match       https://p5play.org/learn/*
// @version     1.0.0
// @description 2024/08/11, 1:40:56 PM
// @run-at      document-end
// @grant       none
// @homepageURL https://github.com/ericchase/browser--userscripts
// ==/UserScript==
`;

import { ElementAddedObserver } from './lib/ericchase/Platform/Web/DOM/MutationObserver/ElementAdded.js';

new ElementAddedObserver({
  selector: '.unauth',
}).subscribe((element) => {
  element.remove();
});

document.body.style.setProperty('overflow', 'unset');
