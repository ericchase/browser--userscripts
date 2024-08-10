// ==UserScript==
// @name        com.khinsider: Generate Album Downloader
// @author      ericchase
// @namespace   ericchase
// @match       *://downloads.khinsider.com/game-soundtracks/album/*
// @version     1.0.0
// @description 12/20/2023, 9:22:10 AM
// @run-at      document-start
// @grant       none
// @homepageURL https://github.com/ericchase/browser--userscripts
// ==/UserScript==

// src/lib/external/Algorithm/Sleep.ts
function Sleep(ms) {
  return new Promise((resolve) => setTimeout(() => resolve(), ms));
}

// src/lib/external/Data Structure/JobQueue.ts
class JobQueue {
  delay_ms;
  constructor(delay_ms) {
    this.delay_ms = delay_ms;
  }
  add(fn) {
    this.queue.push(fn);
    if (this.running === false) {
      this.running = true;
      this.run();
    }
  }
  get done() {
    return this.completionCount === this.queue.length ? true : false;
  }
  subscribe(callback) {
    this.subscriptionSet.add(callback);
    for (const result of this.results) {
      if (callback(result.value, result.error)?.abort === true) {
        this.subscriptionSet.delete(callback);
        return () => {};
      }
    }
    return () => {
      this.subscriptionSet.delete(callback);
    };
  }
  queue = [];
  queueIndex = 0;
  completionCount = 0;
  results = [];
  running = false;
  subscriptionSet = new Set();
  run() {
    if (this.queueIndex < this.queue.length) {
      this.queue[this.queueIndex++]()
        .then((value) => this.send({ value }))
        .catch((error) => this.send({ error }));
      setTimeout(() => this.run(), this.delay_ms);
    } else {
      this.running = false;
    }
  }
  send(result) {
    this.completionCount++;
    this.results.push(result);
    for (const callback of this.subscriptionSet) {
      if (callback(result.value, result.error)?.abort === true) {
        this.subscriptionSet.delete(callback);
      }
    }
  }
}

// src/lib/external/Platform/Web/AnchorDownloader.ts
function anchor_downloader(data, filename) {
  const a = document.createElement('a');
  a.setAttribute('href', data);
  a.setAttribute('download', filename);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
function SaveBlob(blob, filename) {
  anchor_downloader(URL.createObjectURL(blob), filename);
}
function SaveText(text, filename) {
  SaveBlob(new Blob([text], { type: 'text/plain;charset=utf-8' }), filename);
}

// src/lib/external/Platform/Web/DOM/MutationObserver.ts
class ElementAddedObserver {
  constructor({ source, options = { subtree: true }, selector, includeExistingElements = true }) {
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

class AttributeObserver {
  constructor({ source, options = { attributeOldValue: true, subtree: true } }) {
    this.mutationObserver = new MutationObserver((mutationRecords) => {
      for (const record of mutationRecords) {
        if (record.type === 'attributes') {
          this.send(record.target, record.attributeName, record.oldValue);
        }
      }
    });
    this.mutationObserver.observe(source, { attributes: true, attributeFilter: options.attributeFilter, attributeOldValue: options.attributeOldValue ?? true, subtree: options.subtree ?? true });
  }
  subscribe(callback) {
    this.subscriptionSet.add(callback);
    return () => {
      this.subscriptionSet.delete(callback);
    };
  }
  mutationObserver;
  subscriptionSet = new Set();
  send(element, attributeName, oldValue) {
    for (const callback of this.subscriptionSet) {
      if (callback({ element, attributeName, oldValue: oldValue ?? undefined })?.abort === true) {
        this.subscriptionSet.delete(callback);
      }
    }
  }
}

// src/lib/external/Platform/Web/WindowProxy.ts
function OpenWindow(url, onLoad, onUnload) {
  const proxy = window.open(url, '_blank');
  if (proxy) {
    if (onLoad) {
      proxy.addEventListener('load', (event) => {
        onLoad(proxy, event);
      });
    }
    if (onUnload) {
      proxy.addEventListener('unload', (event) => {
        onUnload(proxy, event);
      });
    }
  }
}

// src/com.khinsider.Generate Album Downloader.user.ts
async function main() {
  const trackList = [];
  const jobQueue = new JobQueue(1000);
  jobQueue.subscribe((trackDetails, error) => {
    if (error) console.log(error);
    if (trackDetails) {
      trackList.push(trackDetails);
      if (jobQueue.done === true) {
        generateDownloaderScript(trackList);
      }
    }
  });
  new ElementAddedObserver({
    source: document,
    selector: 'table#songlist',
  }).subscribe((tableSonglist) => {
    if (tableSonglist instanceof HTMLTableElement) {
      for (const anchorSong of tableSonglist.querySelectorAll('.playlistDownloadSong > a')) {
        if (anchorSong instanceof HTMLAnchorElement) {
          jobQueue.add(() => getSongUris(anchorSong));
        }
      }
    }
  });
}
function getSongUris(anchorSong) {
  return new Promise((resolve, reject) => {
    OpenWindow(anchorSong.href, async (proxy) => {
      try {
        let albumName = '';
        let trackName = '';
        const uris = [];
        new ElementAddedObserver({
          source: proxy.document.documentElement,
          selector: '#pageContent > p',
        }).subscribe((element) => {
          const treeWalker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
          while (treeWalker.nextNode()) {
            if (treeWalker.currentNode.nodeValue?.trim() === 'Album name:') {
              if (treeWalker.nextNode()) {
                albumName = treeWalker.currentNode.nodeValue?.trim() ?? '';
                break;
              }
            }
          }
          while (treeWalker.nextNode()) {
            if (treeWalker.currentNode.nodeValue?.trim() === 'Song name:') {
              if (treeWalker.nextNode()) {
                trackName = treeWalker.currentNode.nodeValue?.trim() ?? '';
                break;
              }
            }
          }
        });
        new ElementAddedObserver({
          source: proxy.document.documentElement,
          selector: '.songDownloadLink',
        }).subscribe((element) => {
          if (element?.parentElement?.href) {
            uris.push(element.parentElement.href);
          }
        });
        await Sleep(2000);
        proxy.close();
        return resolve({ albumName, trackName, uris });
      } catch (_) {
        return reject();
      }
    });
  });
}
function generateDownloaderScript(trackList) {
  const albumMap = new Map();
  for (const details of trackList) {
    if (!albumMap.has(details.albumName)) {
      albumMap.set(details.albumName, []);
    }
    const albumGroup = albumMap.get(details.albumName) ?? [];
    albumGroup.push(details);
  }
  for (const [albumName, trackList2] of albumMap) {
    SaveText(
      `import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

export function Sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(() => resolve(), ms));
}

type TrackDetails = { albumName: string; trackName: string; uris: string[] };

const trackList: TrackDetails[] = JSON.parse(\`${JSON.stringify(trackList2)}\`);
const albumName = \`${albumName}\`;

console.log('Album:', albumName);
const url = new URL(trackList[0].uris[0]);
const segments = url.pathname.slice(1 + url.pathname.indexOf('/')).split('/');
const albumpath = Bun.fileURLToPath(Bun.pathToFileURL(resolve(import.meta.dir + '/' + segments[1])));
console.log('Create Directory:', albumpath);
await mkdir(albumpath, { recursive: true });

for (const { trackName, uris } of trackList) {
  for (const uri of uris) {
    console.log('Track:', trackName);
    const url = new URL(uri);
    const segments = url.pathname.slice(1 + url.pathname.indexOf('/')).split('/');
    const filepath = Bun.fileURLToPath(Bun.pathToFileURL(resolve(albumpath + '/' + segments[segments.length - 1])));
    const response = await fetch(uri);
    console.log('Write File:', filepath);
    await Bun.write(filepath, await response.blob());
    await Sleep(1000);
  }
}`,
      'download_' + albumName + '.ts',
    );
  }
}
main();
