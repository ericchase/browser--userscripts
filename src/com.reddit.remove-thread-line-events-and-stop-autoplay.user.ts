import { ElementAddedObserver } from 'lib/ericchase/Platform/Web/DOM/MutationObserver/ElementAdded.js';
import { HasProperty } from 'lib/ericchase/Utility/Guard.js';
import { Sleep } from 'lib/ericchase/Utility/Sleep.js';

const header = `
// ==UserScript==
// @name        reddit.com: remove thread line events & stop videos
// @author      ericchase
// @namespace   ericchase
// @match       https://www.reddit.com/*
// @version     1.0.0
// @description 11/23/2024, 12:47:12 AM
// @run-at      document-start
// @grant       none
// @homepageURL https://github.com/ericchase/browser--userscripts
// ==/UserScript==
`;

const originalAttachShadow = Element.prototype.attachShadow;
Element.prototype.attachShadow = function (options) {
  const shadowRoot = originalAttachShadow.call(this, options);
  if (this.matches('shreddit-comment')) {
    processComment(this);
  } else if (this.matches('shreddit-player-2')) {
    processVideo(this);
  }
  return shadowRoot;
};

async function processComment(element: Element) {
  if (element.shadowRoot) {
    const shadowRoot = element.shadowRoot;

    // handle main thread line
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

    // handle curved thread line
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

async function processVideo(element: Element) {
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

function playHandler(event: Event) {
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

  // const controls = video.nextElementSibling?.shadowRoot?.querySelector('.controls');
  // if (controls instanceof HTMLElement) {
  //   controls.click();
  // }
}

function shadowSelectorChain(source: Node | null | undefined, ...selectors: string[]) {
  let target: Node | null | undefined = source;
  for (const selector of selectors) {
    if (HasProperty(target, 'shadowRoot')) {
      target = target.shadowRoot;
    }
    if (target instanceof Element || target instanceof ShadowRoot) {
      target = target.querySelector(selector);
    } else {
      return undefined;
    }
  }
  return target;
}
