// ==UserScript==
// @name        Google: Direct URL for Search Results
// @description 8/10/2022, 2:24:13 AM
// @namespace   ericchase
// @version     1.0.0
// @author      ericchase
// @match       *://*.google.com/*
// @grant       none
// @run-at      document-start
// ==/UserScript==

const observer = new MutationObserver(callback);

function callback(mutationList) {
    for (const record of mutationList) {
        if (record.target.getAttribute('data-href') !== record.target.getAttribute('href')) {
            if (record.oldValue) {
                record.target.setAttribute('data-href', record.oldValue);
                record.target.setAttribute('href', record.oldValue);
            } else {
                record.target.setAttribute('data-href', record.target.getAttribute('href'));
            }
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
    if (event.target.nodeName === 'H3' && event.target.parentNode.nodeName === 'A') {
        event.stopImmediatePropagation();
        event.target.parentNode.setAttribute('href', event.target.parentNode.getAttribute('data-href'));
    }
}
