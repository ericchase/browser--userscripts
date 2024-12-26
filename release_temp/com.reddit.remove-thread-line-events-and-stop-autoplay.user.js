// src/lib/ericchase/Platform/Web/DOM/MutationObserver/ElementAdded.ts
class ElementAddedObserver {
  constructor({ source = document.documentElement, options = { subtree: true }, selector, includeExistingElements = true }) {
    this.mutationObserver = new MutationObserver((mutationRecords) => {
      for (const record of mutationRecords) {
        if (record.target instanceof Element && record.target.matches(selector)) {
          this.send(record.target);
        }
        const treeWalker = document.createTreeWalker(record.target, NodeFilter.SHOW_ELEMENT);
        while (treeWalker.nextNode()) {
          if (treeWalker.currentNode.matches(selector)) {
            this.send(treeWalker.currentNode);
          }
        }
      }
    });
    this.mutationObserver.observe(source, {
      childList: true,
      subtree: options.subtree ?? true,
    });
    if (includeExistingElements === true) {
      const treeWalker = document.createTreeWalker(document, NodeFilter.SHOW_ELEMENT);
      while (treeWalker.nextNode()) {
        if (treeWalker.currentNode.matches(selector)) {
          this.send(treeWalker.currentNode);
        }
      }
    }
  }
  disconnect() {
    this.mutationObserver.disconnect();
    for (const callback of this.subscriptionSet) {
      this.subscriptionSet.delete(callback);
    }
  }
  subscribe(callback) {
    this.subscriptionSet.add(callback);
    let abort = false;
    for (const element of this.matchSet) {
      callback(element, () => {
        this.subscriptionSet.delete(callback);
        abort = true;
      });
      if (abort) return () => {};
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
        callback(element, () => {
          this.subscriptionSet.delete(callback);
        });
      }
    }
  }
}

// src/lib/ericchase/Utility/Guard.ts
function HasProperty(item, key) {
  return typeof item === 'object' && item !== null && key in item && typeof item[key] !== 'undefined';
}

// src/lib/ericchase/Utility/Sleep.ts
async function Sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

// src/com.reddit.remove-thread-line-events-and-stop-autoplay.user.ts
var originalAttachShadow = Element.prototype.attachShadow;
Element.prototype.attachShadow = function (options) {
  const shadowRoot = originalAttachShadow.call(this, options);
  if (this.matches('shreddit-comment')) {
    processComment(this);
  } else if (this.matches('shreddit-player-2')) {
    processVideo(this);
  }
  return shadowRoot;
};
async function processComment(element) {
  if (element.shadowRoot) {
    const shadowRoot = element.shadowRoot;
    new ElementAddedObserver({
      selector: 'div[data-testid="main-thread-line"]',
      source: shadowRoot,
    }).subscribe((thread, unsubscribe) => {
      unsubscribe();
      thread.parentElement?.addEventListener(
        'click',
        (event) => {
          event.preventDefault();
          event.stopImmediatePropagation();
          event.stopPropagation();
        },
        true,
      );
    });
    new ElementAddedObserver({
      selector: 'div[data-testid="branch-line"]',
      source: shadowRoot,
    }).subscribe((thread, unsubscribe) => {
      unsubscribe();
      thread.addEventListener(
        'click',
        (event) => {
          event.preventDefault();
          event.stopImmediatePropagation();
          event.stopPropagation();
        },
        true,
      );
    });
  }
}
async function processVideo(element) {
  if (element.shadowRoot) {
    const shadowRoot = element.shadowRoot;
    new ElementAddedObserver({
      selector: 'video',
      source: shadowRoot,
    }).subscribe((video) => {
      console.log('found', video);
      video.addEventListener('play', playHandler);
    });
  }
}
function playHandler(event) {
  if (event?.target instanceof HTMLVideoElement) {
    const video = event.target;
    video.removeEventListener('play', playHandler);
    const controls = shadowSelectorChain(video.parentNode, 'shreddit-media-ui', '[aria-label="Toggle playback"]');
    setTimeout(async () => {
      for (let i = 0; i < 5; i++) {
        if (!video.paused) {
          if (controls instanceof HTMLButtonElement) {
            controls.click();
          } else {
            video.pause();
          }
        }
        Sleep(50);
      }
    }, 50);
  }
}
function shadowSelectorChain(source, ...selectors) {
  let target = source;
  for (const selector of selectors) {
    if (HasProperty(target, 'shadowRoot')) {
      target = target.shadowRoot;
    }
    if (target instanceof Element || target instanceof ShadowRoot) {
      target = target.querySelector(selector);
    } else {
      return;
    }
  }
  return target;
}
