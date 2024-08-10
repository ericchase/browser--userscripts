const header = `
// ==UserScript==
// @name        com.khinsider: Generate Album Downloader
// @author      ericchase
// @namespace   ericchase
// @match       *://downloads.khinsider.com/game-soundtracks/album/*
// @version     1.0.0
// @description 2023/12/20, 9:22:10 AM
// @run-at      document-start
// @grant       none
// @homepageURL https://github.com/ericchase/browser--userscripts
// ==/UserScript==
`;

import { Sleep } from './lib/external/Algorithm/Sleep.js';
import { SaveText } from './lib/external/Platform/Web/AnchorDownloader.js';
import { $$ } from './lib/external/Platform/Web/DOM/Element/QuerySelectorAll.js';
import { ElementAddedObserver } from './lib/external/Platform/Web/DOM/MutationObserver/ElementAddedObserver.js';
import { OpenWindow } from './lib/external/Platform/Web/WindowProxy.js';
import { JobQueue } from './lib/external/Utility/JobQueue.js';

type TrackDetails = { albumName: string; trackName: string; uris: string[] };

async function main() {
  const trackList: TrackDetails[] = [];
  const jobQueue = new JobQueue<TrackDetails>(1000);
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
      for (const anchorSong of $$('a', '.playlistDownloadSong > a', tableSonglist)) {
        if (anchorSong instanceof HTMLAnchorElement) {
          jobQueue.add(() => getSongUris(anchorSong));
        }
      }
    }
  });
}

function getSongUris(anchorSong: HTMLAnchorElement) {
  return new Promise<TrackDetails>((resolve, reject) => {
    OpenWindow(anchorSong.href, async (proxy) => {
      try {
        let albumName = '';
        let trackName = '';
        const uris: string[] = [];

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
          // @ts-ignore
          if (element?.parentElement?.href) {
            // @ts-ignore
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

function generateDownloaderScript(trackList: TrackDetails[]) {
  const albumMap = new Map<string, TrackDetails[]>();
  for (const details of trackList) {
    if (!albumMap.has(details.albumName)) {
      albumMap.set(details.albumName, []);
    }
    const albumGroup = albumMap.get(details.albumName) ?? [];
    albumGroup.push(details);
  }
  for (const [albumName, trackList] of albumMap) {
    SaveText(
      `import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

export function Sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(() => resolve(), ms));
}

type TrackDetails = { albumName: string; trackName: string; uris: string[] };

const trackList: TrackDetails[] = JSON.parse(\`${JSON.stringify(trackList)}\`);
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
