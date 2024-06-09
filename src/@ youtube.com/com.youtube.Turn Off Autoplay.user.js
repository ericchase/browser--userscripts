// ==UserScript==
// @name        turn off autoplay - youtube.com: ??
// @version     1.0.0
// @description 12/23/2023, 9:34:58 AM
// @namespace   ericchase
// @author      ericchase
// @match       https://www.youtube.com/watch
// @grant       none
// @run-at      document-start
// ==/UserScript==

// idk if this works

const id = setInterval(function () {
  const buttonOn = document.querySelector('[title="Autoplay is on"]');
  const buttonOff = document.querySelector('[title="Autoplay is off"]');
  if (buttonOn !== null) {
    clearInterval(id);
    buttonOn.click();
  } else if (buttonOff !== null) {
    clearInterval(id);
  }
}, 2500);
