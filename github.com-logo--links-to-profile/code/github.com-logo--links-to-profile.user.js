// ==UserScript==
// @name            github.com-logo--links-to-profile
// @namespace       https://github.com/ericchase
// @version         0.1
// @author          https://github.com/ericchase
// @description     Clicking the github logo (aka, the octicon) takes the user to his or her profile instead of the dashboard.
// @source          https://github.com/ericchase/userscripts/tree/master/github.com-logo--links-to-profile
// @icon
// @icon64
// @updateURL
// @downloadURL     https://greasyfork.org/en/scripts/32087-github-com-logo-links-to-profile
// @supportURL      https://github.com/ericchase/userscripts/issues
// @include         https://github.com/*
// @match
// @exclude
// @require
// @resource
// @connect
// @run-at          document-end
// @grant           none
// @noframes
// @unwrap
// @nocompat
// ==/UserScript==


var target;
var config;
var observer;


// The setInterval() function with a high frequency is used to hook a
// MutationObserver as quickly as possible to the necessary element. Once the
// observer is hooked, the timer is removed, and the observer handles any
// necessary updates from then on.
(function () {
     'use strict';
     var handle = setInterval(
          function () {
               // The 'div' element with id 'directory-list' contains all the
               // stream preview objects for each tab of the 'following' page.
               target = document.querySelector("body > div.position-relative.js-header-wrapper > div.header > div > div");
               if (target !== null) {
                    clearInterval(handle);
                    // The 'subtree' option is necessary to observe the element
                    // mentioned above. Without it, the observer will never
                    // trigger.
                    config = {
                         attributes: true,
                         childList: true,
                         characterData: true,
                         subtree: true
                    };
                    observer = new MutationObserver(update);
                    observer.observe(target, config);
                    update(null);
               }
          },
          50
     );
})();


function update(mutations) {

     observer.disconnect();

     if (document.querySelector("body > div.position-relative.js-header-wrapper > div.header > div > div > div:nth-child(1) > a") === null) {
          observer.observe(target, config);
          return;
     }

     if (document.querySelector("#user-links > li:nth-child(3) > a") === null) {
          observer.observe(target, config);
          return;
     }

     document.querySelector("body > div.position-relative.js-header-wrapper > div.header > div > div > div:nth-child(1) > a").setAttribute(
          "href",
          document.querySelector("#user-links > li:nth-child(3) > a").getAttribute("href")
     );
}