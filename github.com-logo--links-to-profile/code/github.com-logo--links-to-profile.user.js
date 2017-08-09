// ==UserScript==
// @name            github.com-logo--links-to-profile
// @namespace       https://github.com/ericchase
// @version         0.3
// @author          https://github.com/ericchase
// @description     Clicking the github logo (aka, the octicon) takes the user to his or her profile instead of the dashboard.
// @source          https://github.com/ericchase/userscripts/tree/master/github.com-logo--links-to-profile
// @icon
// @icon64
// @updateURL
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
                var observer = new MutationObserver(update);
                observer.observe(target, config);
                update(null, observer);
            }
        },
        50
    );
})();


function update(mutations, observer) {

    // check to see if logo has loaded
    if (document.querySelector("body > div.position-relative.js-header-wrapper > div.header > div > div > div:nth-child(1) > a") === null) {
        return;
    }


    // check to see if profile button has loaded
    if (document.querySelector("#user-links > li:nth-child(3) > a") === null) {
        return;
    }


    var url_profile = document.querySelector("#user-links > li:nth-child(3) > a").getAttribute("href");

    // if current page is user's profile, then do nothing
    if (url_profile == window.location.pathname) {
        return;
    }


    var logo = document.querySelector("body > div.position-relative.js-header-wrapper > div.header > div > div > div:nth-child(1) > a");

    // change the logo's link
    if (logo.getAttribute("href") != url_profile) {
        observer.disconnect();
        logo.setAttribute("href", url_profile);
    }

}
