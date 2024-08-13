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

// src/lib/external/Platform/Web/DOM/MutationObserver/ElementAdded.ts
class ElementAddedObserver {
  constructor({ source = document.documentElement, options = { subtree: true }, selector, includeExistingElements = true }) {
    this.mutationObserver = new MutationObserver((mutationRecords) => {
      for (const record of mutationRecords) {
        if (record.type === 'childList') {
          if (record.target instanceof Element && record.target.matches(selector)) {
            this.send(record.target);
          }
          for (const node of record.addedNodes) {
            if (node instanceof Element && node.matches(selector)) {
              this.send(node);
            }
          }
        }
      }
    });
    this.mutationObserver.observe(source, { childList: true, subtree: options.subtree ?? true });
    if (includeExistingElements === true) {
      const findMatches = (source2) => {
        if (source2.matches(selector)) {
          this.send(source2);
        }
        for (const element of source2.querySelectorAll(selector)) {
          this.send(element);
        }
      };
      if (source instanceof Element) findMatches(source);
      else if (source.querySelectorAll) {
        for (const element of source.querySelectorAll(selector)) {
          this.send(element);
        }
      } else {
        if (source.parentElement) findMatches(source.parentElement);
        else {
          for (const node of source.childNodes) {
            if (node instanceof Element) {
              findMatches(node);
            }
          }
        }
      }
    }
  }
  subscribe(callback) {
    this.subscriptionSet.add(callback);
    for (const element of this.matchSet) {
      if (callback(element)?.abort === true) {
        this.subscriptionSet.delete(callback);
        return () => {};
      }
    }
    return () => {
      this.subscriptionSet.delete(callback);
    };
  }
  mutationObserver;
  matchSet = new Set();
  subscriptionSet = new Set();
  send(element) {
    if (!this.matchSet.has(element)) {
      this.matchSet.add(element);
      for (const callback of this.subscriptionSet) {
        if (callback(element)?.abort === true) {
          this.subscriptionSet.delete(callback);
        }
      }
    }
  }
}

// src/org.p5play.Remove Login Modal.user.ts
new ElementAddedObserver({
  selector: '.unauth',
}).subscribe((element) => {
  element.remove();
});
document.body.style.setProperty('overflow', 'unset');
