// ==UserScript==
// @name        Google: Result Links Go Directly to URL
// @description 8/10/2022, 2:24:13 AM
// @namespace   ericchase
// @version     1.0.0
// @author      ericchase
// @match       *://*.google.com/*
// @grant       none
// @run-at      document-start
// ==/UserScript==

const observer = new MutationObserver(callback);

function callback(mutationList, observer) {
    for (const record of mutationList) {
        if (record.target.getAttribute('data-href') !== record.target.getAttribute('href')) {
            record.target.setAttribute('data-href', record.oldValue);
            record.target.setAttribute('href', record.oldValue);
        }
    }
}

observer.observe(document, {
    subtree: true,
    attributes: true,
    attributeOldValue: true,
    attributeFilter: ['href']
});

document.addEventListener('auxclick', interceptNavigation, { capture: true });
document.addEventListener('click', interceptNavigation, { capture: true });

function interceptNavigation(event) {
    event.stopImmediatePropagation();
    event.stopPropagation();
    if (event.target.nodeName === 'H3' && event.target.parentNode.nodeName === 'A') {
        event.preventDefault();
        event.target.parentNode.click();
    }
}
