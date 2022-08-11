// ==UserScript==
// @name        Google: Hide Search Result Distractions
// @description 8/11/2022, 1:39:30 AM
// @namespace   ericchase
// @version     2.0.0
// @author      ericchase
// @match       *://*.google.com/*
// @grant       none
// @run-at      document-start
// ==/UserScript==

const SELECTOR = {
    SEARCH_RESULT_SECTION: '#rso',
    SEARCH_RESULT_ITEM: 'div.g',
    SEARCH_RESULT_TITLE: 'a > h3',
    SEARCH_TRAY_HEADER: 'g-tray-header',
    BOTTOM_SECTION: '#botstuff',
    NAVIGATION: 'div[role="navigation"]',
}

// User defined list
const BANNED_PHRASES = [
    'best'
];

// User defined function
function filterSearchResult(element) {
    const title = element.querySelector(SELECTOR.SEARCH_RESULT_TITLE)?.textContent.toLowerCase();
    if (title) {
        for (const phrase of BANNED_PHRASES) {
            if (title.includes(phrase)) {
                element.style.opacity = 0.25;
            }
        }
    }
}

function watchForElement({ selector, root, subtree }, fn) {
    root ??= document;
    if (typeof selector !== 'string') return;
    new MutationObserver(function (records, observer) {
        for (const record of records) {
            if (record?.addedNodes?.length === 0) continue;
            for (const node of record?.addedNodes) {
                if (node?.constructor?.name !== 'HTMLDivElement') continue;
                if (node?.matches?.(selector) === false) continue;
                if (fn?.(node) === false) {
                    observer.disconnect();
                    return;
                }
            }
        }
    }).observe(root, { childList: true, subtree });
}

function watchForChildren({ selector, root }, fn) {
    watchForElement({ selector, root, subtree: false }, fn);
}

function watchForDescendants({ selector, root }, fn) {
    watchForElement({ selector, root, subtree: true }, fn);
}

function get(selector) {
    return new Promise(async function (resolve) {
        watchForDescendants({ selector }, function (element) {
            resolve(element);
            return false;
        });
    });
}

function hide(element) {
    element.hidden = true;
    element.style.display = 'none';
}

const setOfSearchResults = new Set();
function processRSOChild(rso, element) {
    hide(element);
    watchForDescendants({ selector: SELECTOR.SEARCH_RESULT_ITEM, root: element }, function (element) {
        setOfSearchResults.add(element);
        rso.appendChild(element);
    });
    for (const child of element.querySelectorAll(SELECTOR.SEARCH_RESULT_ITEM)) {
        setOfSearchResults.add(child);
        rso.appendChild(child);
    }
}

function catchResultTray(result) {
    watchForDescendants({ selector: SELECTOR.SEARCH_TRAY_HEADER, root: result }, function () {
        hide(result);
        return false;
    });
    if (result.querySelector(SELECTOR.SEARCH_TRAY_HEADER)) {
        hide(result);
    }
}

get(SELECTOR.SEARCH_RESULT_SECTION).then(rso => {
    watchForChildren({ selector: '*', root: rso }, function (element) {
        if (element.matches(SELECTOR.SEARCH_RESULT_ITEM)) {
            filterSearchResult(element);
            catchResultTray(element);
        } else {
            processRSOChild(rso, element);
        }
    });
    for (const element of [...rso.children]) {
        processRSOChild(rso, element);
    }
});

function processBotStuffChild(botstuff, element) {
    hide(element);
    watchForDescendants({ selector: SELECTOR.NAVIGATION, root: element }, function (element) {
        botstuff.appendChild(element);
    });
    for (const child of element.querySelectorAll(SELECTOR.NAVIGATION)) {
        botstuff.appendChild(child);
    }
}

get(SELECTOR.BOTTOM_SECTION).then(botstuff => {
    watchForChildren({ selector: '*', root: botstuff }, function (element) {
        if (element.matches(SELECTOR.NAVIGATION)) {
        } else {
            processBotStuffChild(botstuff, element);
        }
    });
    for (const element of [...botstuff.children]) {
        processBotStuffChild(botstuff, element);
    }
});