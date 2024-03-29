// ==UserScript==
// @name        - simple-mmo.com: ??
// @description 1/22/2023, 11:35:29 PM
// @namespace   ericchase
// @version     1.0.0
// @author      ericchase
// @match       https://web.simple-mmo.com/travel
// @grant       none
// @run-at      document-start
// ==/UserScript==

(async function main() {
  /** @type HTMLButtonElement */
  const stepButton = await waitForStepButton();
  watchForAttributeChange({ target: stepButton, filter: ['disabled'] }, function (record) {
    if (stepButton.getAttribute('disabled') === null) {
      click(stepButton);
    }
  });
})();

async function waitForStepButton() {
  return await new Promise((resolve, reject) => {
    watchForDescendants({ selector: '#step_button' }, function (el) {
      resolve(el);
      return false;
    });
  });
}

async function click(button) {
  return await new Promise((resolve, reject) => {
    setTimeout(() => {
      button.click();
      resolve();
    }, Math.random() * 1000);
  });
}

//
// Mutation Observer Functions
// 2023-01-23

/**
 * @param {object} param0
 * @param {Node} param0.target
 * @param {string[]} param0.filter
 * @param {(record: MutationRecord) => boolean} fn
 */
function watchForAttributeChange({ target, filter }, fn) {
  if (!(target instanceof Node)) return;
  const observer = new MutationObserver(function (records, observer) {
    for (const record of records) {
      if (fn?.(record) === false) {
        return observer.disconnect();
      }
    }
  });
  observer.observe(target, {
    attributes: true,
    attributeOldValue: true,
    attributeFilter: filter,
  });
  return observer;
}

/**
 * @param {object} param0
 * @param {string} param0.selector
 * @param {boolean} param0.subtree
 * @param {Node} param0.root
 * @param {(element: HTMLElement, record?: MutationRecord) => boolean} fn
 */
function watchForElement({ selector, subtree, root }, fn) {
  root ??= document;
  if (typeof selector !== 'string') return;
  const observer = new MutationObserver(function (records, observer) {
    for (const record of records) {
      if (record.addedNodes?.length === 0) continue;
      const elementList = record.target.querySelectorAll(selector);
      for (const element of elementList) {
        if (fn?.(element, record) === false) {
          return observer.disconnect();
        }
      }
    }
  });
  observer.observe(root, {
    childList: true,
    subtree,
  });
  const element = root.querySelector(selector);
  if (element) {
    if (fn?.(element) === false) {
      observer.disconnect();
    }
  }
  return observer;
}

/** Watches for immediate children only.
 * @param {object} param0
 * @param {string} param0.selector
 * @param {Node} param0.root
 * @param {(element: HTMLElement, record: MutationRecord) => boolean} fn
 */
function watchForChildren({ selector, root }, fn) {
  return watchForElement({ selector, subtree: false, root }, fn);
}

/** Watches for children and children's children.
 * @param {object} param0
 * @param {string} param0.selector
 * @par
 * am {Node} param0.root
 * @param {(element: HTMLElement, record: MutationRecord) => boolean} fn
 */
function watchForDescendants({ selector, root }, fn) {
  return watchForElement({ selector, subtree: true, root }, fn);
}
