import { Sleep } from './lib/external/Algorithm/Sleep.js';
import { ElementAddedObserver } from './lib/external/Platform/Web/DOM/MutationObserver.js';
import { OpenWindow } from './lib/external/Platform/Web/DOM/WindowProxy.js';

const header = `
// ==UserScript==
// @name        com.khinsider: Get Download Links
// @author      ericchase
// @namespace   ericchase
// @match       *://downloads.khinsider.com/game-soundtracks/album/*
// @version     1.0.0
// @description 12/20/2023, 9:22:10 AM
// @run-at      document-start
// @grant       none
// @homepageURL https://github.com/ericchase/browser--userscripts
// ==/UserScript==
`;

async function main() {
  const observer = new ElementAddedObserver({
    source: document,
    options: { childList: true, subtree: true },
    selector: '.playlistDownloadSong > a',
  });
  observer.subscribe((element) => {
    if (element instanceof HTMLAnchorElement) {
      OpenWindow(element.href, async (proxy) => {
        const observer = new ElementAddedObserver({
          source: proxy.document.documentElement,
          options: { childList: true, subtree: true },
          selector: '.songDownloadLink',
        });
        observer.subscribe((element) => {
          console.log(element?.parentElement?.href);
        });
        await Sleep(1000);
        proxy.close();
      });
    }
    return { abort: true };
  });
}

main();
