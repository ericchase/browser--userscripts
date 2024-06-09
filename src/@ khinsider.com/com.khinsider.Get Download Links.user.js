// ==UserScript==
// @name        get download links - khinsider.com
// @version     1.0.0
// @description 12/20/2023, 9:22:10 AM
// @namespace   ericchase
// @author      ericchase
// @match       https://downloads.khinsider.com/game-soundtracks/album/*
// @grant       none
// @run-at      document-start
// ==/UserScript==

// will automatically try to open all links in an album.
// needs to be revamped for sure

/** @param {Window} [proxy=window] */
function getMP3DownloadLink(proxy = window) {
  const songDownloadLink = [...proxy.document.querySelectorAll('.songDownloadLink')];
  for (const el of songDownloadLink) {
    if (el.textContent?.includes('MP3')) {
      return el.parentElement?.getAttribute('href') ?? '';
    }
  }
}

/** @param {Window} [proxy=window] */
function getPageLinks(proxy = window) {
  const playlistDownloading = [...proxy.document.querySelectorAll('.playlistDownloadSong')];
  return playlistDownloading
    .map((_) => _.querySelector('a')) //
    .filter((_) => _)
    .map((_) => _.getAttribute('href')) // get relative page link
    .filter((_) => _)
    .map((_) => 'https://downloads.khinsider.com' + _)
    .filter((_) => _); // make absolute
}

async function main() {
  const pageUrls = getPageLinks();
  const downloads = [];
  await $asyncloop(
    async () => {},
    async (_, index) => index < pageUrls.length,
    async (_, index) => {
      const url = pageUrls[index];
      const proxy = open(url, '_blank');
      if (proxy) {
        while (true) {
          const url = getMP3DownloadLink(proxy);
          if (url !== undefined) {
            const filename = window.decodeURI(url.split('/').at(-1) ?? '');
            downloads.push({ url, filename });
            proxy.close();
            break;
          }
          await sleep(50);
        }
      }
      await sleep(50);
    },
  );
  console.log(JSON.stringify(downloads));
}

setTimeout(main, 2000);

/** @param {number} ms */
async function sleep(ms) {
  await new Promise((resolve) => setTimeout(() => resolve(undefined), ms));
}

/**
 * @template T
 * @typedef AsyncLoopConfig
 * @property {()=>Promise<T>} step
 * @property {(value:T,index:number)=>Promise<boolean>} condition
 * @property {(value:T,index:number,done:()=>void)=>Promise<*>} body
 */
/**
 * @template T
 * @param {(()=>Promise<T>)|AsyncLoopConfig<T>} step
 * @param {(value:T,index:number)=>Promise<boolean>=} condition
 * @param {(value:T,index:number,done:()=>void)=>*=} body
 */
async function $asyncloop(step, condition, body) {
  if (typeof step === 'function') {
    if (typeof condition === 'function' && typeof body === 'function') {
      await asyncloop({ step, condition, body });
    }
  } else {
    await asyncloop(step);
  }
}
/**
 * @template T
 * @param {AsyncLoopConfig<T>} params
 */
async function asyncloop({ step, condition, body }) {
  let isDone = false;
  const done = () => (isDone = true);
  for (let value = await step(), index = 0; (await condition(value, index)) === true; value = await step(), index++) {
    await body(value, index, done);
    if (isDone) return;
  }
}
