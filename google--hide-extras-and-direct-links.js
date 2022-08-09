// ==UserScript==
// @name        Google: Hide Extras. Direct Links
// @description 3/19/2022, 7:09:32 PM
// @namespace   ericchase
// @version     1.0.0
// @author      ericchase
// @match       *://*.google.com/*
// @grant       none
// @run-at      document-start
// ==/UserScript==

function waitFor({ selector, root = document, recursive = false }, fn) {
    let count = 0;
    new MutationObserver(function (_, observer) {
        const nodes = root.querySelectorAll(selector);
        if (nodes && nodes.length > count) {
            count = nodes.length;
            if (fn && !fn(nodes)) {
                observer.disconnect();
            }
        }
    }).observe(root, { subtree: !!recursive, childList: true, });
}

const found = new Set();
const filtered = new Set();

function filterNode(node) {
    if (filtered.has(node) === false) {
        filtered.add(node);
        node.style.display = 'none';
        // console.log('filtered', node);
    }
}

function unfilterNode(node) {
    if (filtered.has(node)) {
        filtered.delete(node);
        node.style.display = null;
        // console.log('un-filtered', node);
    }
}

function toggleFilteredNodes() {
    for (const node of filtered) {
        if (node.style.display === 'none') {
            node.style.display = null;
        } else {
            node.style.display = 'none';
        }
    }
}

function createScriptButton(tsf) {
    const toggleButton = document.createElement('button');
    toggleButton.innerText = 'show';
    toggleButton.style.cssText = 'cursor: pointer;'
        + 'border: 1px solid #f0f0f0;'
        + 'border-radius: 100px;'
        + 'background-color: #f1f3f4;'
        + 'width: 60px;'
        + 'margin: 2px 2px 2px 0px;';

    let enabled = true;
    toggleButton.addEventListener('click', function (event) {
        event.preventDefault();
        enabled = !enabled;
        toggleButton.innerText = enabled ? 'show' : 'filter';
        toggleFilteredNodes();
    }, true);

    tsf.querySelector('button').after(toggleButton);
}

function checkAncestor(node, fn) {
    while (node.parentNode)
        if (fn(node.parentNode))
            return node;
        else
            node = node.parentNode;
    return undefined;
}

let container = undefined;
let overview = undefined;
function processResults(nodes) {
    if (!overview) {
        overview = rso.querySelector('div[id$="tab-overview"]');
        if (overview) {
            for (const node of found) {
                found.delete(node);
                unfilterNode(node);
            }
            container = overview;
        }
    }

    for (const child of container.children) {
        if (child.tagName === 'DIV') {
            if (child.querySelector('h3')?.innerText === 'Images') continue;
            if (found.has(child) === false) {
                found.add(child);
                filterNode(child);
            }
        }
    }

    for (const node of nodes) {
        // this is a bit convoluted, but i don't feel like changing it right now
        const ancestor = checkAncestor(node, p => {
            if (p === container) return p;
            if (p.id.startsWith('WEB_ANSWERS_')) return "skip";
            if (p.textContent.startsWith('People also ask')) return "skip";
        });
        if (ancestor && ancestor !== "skip") {
            // console.log(ancestor);
            unfilterNode(ancestor);
        }
    }
}
function refSwap(event) {
    event.stopImmediatePropagation();
    event.stopPropagation();
    const a = event.currentTarget;
    a.href = a.getAttribute('oref');
}
function attachEvent(nodes) {
    for (const link of rso.querySelectorAll('a')) {
        link.setAttribute('oref', link.href);
        link.addEventListener('auxclick', refSwap, { capture: true });
        link.addEventListener('click', refSwap, { capture: true });
    }
}

function findSearchResults(rso) {
    container = rso;
    processResults(rso.querySelectorAll('div.g'));
    waitFor({ selector: 'div.g', root: rso, recursive: true },
        function (nodes) { processResults(nodes); return true; })
    waitFor({ selector: 'div.g a', root: rso, recursive: true },
        function (nodes) { attachEvent(nodes); return true; })
}

(async function main() {
    waitFor({ selector: '#rso', recursive: true },
        function (nodes) { findSearchResults(nodes[0]); });
    waitFor({ selector: '#botstuff', recursive: true },
        function (nodes) { filterNode(nodes[0].childNodes[0].childNodes[0]); });
    waitFor({ selector: '#tsf', recursive: true },
        function (nodes) { createScriptButton(nodes[0]); });
}());
