// ==UserScript==
// @name        youtube.com: Turn Off Autoplay
// @author      ericchase
// @namespace   ericchase
// @match       *://www.youtube.com/watch
// @version     1.0.0
// @description 12/23/2023, 9:34:58 AM
// @run-at      document-start
// @grant       none
// @homepageURL https://github.com/ericchase/browser--userscripts
// ==/UserScript==

// idk if this works

const id = setInterval(() => {
  const buttonOn = document.querySelector('[title="Autoplay is on"]');
  const buttonOff = document.querySelector('[title="Autoplay is off"]');
  if (buttonOn !== null) {
    clearInterval(id);
    buttonOn.click();
  } else if (buttonOff !== null) {
    clearInterval(id);
  }
}, 2500);
