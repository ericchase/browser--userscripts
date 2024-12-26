// src/lib/ericchase/Platform/Web/AnchorDownloader.ts
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

// src/lib/ericchase/Platform/Web/Window/Open.ts
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

// src/lib/ericchase/Design Pattern/Observer/Store.ts
class ConstantStore {
  value;
  subscriptionSet = new Set();
  constructor(value) {
    this.value = value;
  }
  subscribe(callback) {
    this.subscriptionSet.add(callback);
    if (this.value !== undefined) {
      callback(this.value, () => {
        this.subscriptionSet.delete(callback);
      });
    }
    return () => {
      this.subscriptionSet.delete(callback);
    };
  }
  get() {
    return new Promise((resolve) => {
      this.subscribe((value, unsubscribe) => {
        unsubscribe();
        resolve(value);
      });
    });
  }
  set(value) {
    if (this.value === undefined) {
      this.value = value;
      for (const callback of this.subscriptionSet) {
        callback(value, () => {
          this.subscriptionSet.delete(callback);
        });
      }
    }
  }
}
class Store {
  initialValue;
  notifyOnChangeOnly;
  currentValue;
  subscriptionSet = new Set();
  constructor(initialValue, notifyOnChangeOnly = false) {
    this.initialValue = initialValue;
    this.notifyOnChangeOnly = notifyOnChangeOnly;
    this.currentValue = initialValue;
  }
  subscribe(callback) {
    this.subscriptionSet.add(callback);
    const unsubscribe = () => {
      this.subscriptionSet.delete(callback);
    };
    callback(this.currentValue, unsubscribe);
    return unsubscribe;
  }
  get() {
    return new Promise((resolve) => {
      this.subscribe((value, unsubscribe) => {
        unsubscribe();
        resolve(value);
      });
    });
  }
  set(value) {
    if (this.notifyOnChangeOnly && this.currentValue === value) return;
    this.currentValue = value;
    for (const callback of this.subscriptionSet) {
      callback(value, () => {
        this.subscriptionSet.delete(callback);
      });
    }
  }
  update(callback) {
    this.set(callback(this.currentValue));
  }
}

// src/lib/ericchase/Utility/UpdateMarker.ts
class UpdateMarker {
  $manager;
  updated = false;
  constructor($manager) {
    this.$manager = $manager;
  }
  reset() {
    this.$manager.resetMarker(this);
  }
}

class UpdateMarkerManager {
  $marks = new Set();
  getNewMarker() {
    const marker = new UpdateMarker(this);
    this.$marks.add(marker);
    return marker;
  }
  resetMarker(mark) {
    mark.updated = false;
    this.$marks.add(mark);
  }
  updateMarkers() {
    for (const mark of this.$marks) {
      this.$marks.delete(mark);
      mark.updated = true;
    }
  }
}

class DataSetMarker {
  $manager;
  dataset = new Set();
  constructor($manager) {
    this.$manager = $manager;
  }
  reset() {
    this.$manager.resetMarker(this);
  }
}

class DataSetMarkerManager {
  $marks = new Set();
  getNewMarker() {
    const marker = new DataSetMarker(this);
    this.$marks.add(marker);
    return marker;
  }
  resetMarker(mark) {
    mark.dataset.clear();
    this.$marks.add(mark);
  }
  updateMarkers(data) {
    for (const mark of this.$marks) {
      mark.dataset.add(data);
    }
  }
}

// src/lib/ericchase/Utility/Console.ts
var marker_manager = new UpdateMarkerManager();
var newline_count = 0;
function ConsoleLog(...items) {
  console['log'](...items);
  newline_count = 0;
  marker_manager.updateMarkers();
}

// src/lib/ericchase/Utility/JobQueue.ts
class JobQueue {
  delay_ms;
  constructor(delay_ms) {
    this.delay_ms = delay_ms;
  }
  async abort() {
    this.aborted = true;
    await this.done;
  }
  add(fn, tag) {
    if (this.aborted === false) {
      this.queue.push({ fn, tag });
      if (this.running === false) {
        this.running = true;
        this.run();
      }
    }
  }
  get done() {
    return new Promise((resolve) => {
      this.runningCount.subscribe((count) => {
        if (count === 0) resolve();
      });
    });
  }
  async reset() {
    if (this.running === true || (await this.runningCount.get()) > 0) {
      throw 'Warning: Wait for running jobs to finish before calling reset. `await JobQueue.done;`';
    }
    this.aborted = false;
    this.completionCount = 0;
    this.queue.length = 0;
    this.queueIndex = 0;
    this.results.length = 0;
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
  aborted = false;
  completionCount = 0;
  queue = [];
  queueIndex = 0;
  results = [];
  running = false;
  runningCount = new Store(0);
  subscriptionSet = new Set();
  run() {
    if (this.aborted === false && this.queueIndex < this.queue.length) {
      const { fn, tag } = this.queue[this.queueIndex++];
      (async () => {
        this.runningCount.update((count) => {
          return count + 1;
        });
        try {
          const value = await fn();
          this.send({ value, tag });
        } catch (error) {
          ConsoleLog(error);
          this.send({ error, tag });
        }
        this.runningCount.update((count) => {
          return count - 1;
        });
        if (this.delay_ms < 0) {
          this.run();
        }
      })();
      if (this.delay_ms >= 0) {
        setTimeout(() => this.run(), this.delay_ms);
      }
    } else {
      this.running = false;
    }
  }
  send(result) {
    if (this.aborted === false) {
      this.completionCount++;
      this.results.push(result);
      for (const callback of this.subscriptionSet) {
        if (callback(result.value, result.error, result.tag)?.abort === true) {
          this.subscriptionSet.delete(callback);
        }
      }
    }
  }
}
new JobQueue(0);

// src/lib/ericchase/Utility/String.ts
function GetLeftMarginSize(text) {
  let i = 0;
  for (; i < text.length; i++) {
    if (text[i] !== ' ') {
      break;
    }
  }
  return i;
}
function LineIsOnlyWhiteSpace(line) {
  return /^\s*$/.test(line);
}
function RemoveWhiteSpaceOnlyLinesFromTopAndBottom(text) {
  const lines = SplitLines(text);
  return lines.slice(
    lines.findIndex((line) => LineIsOnlyWhiteSpace(line) === false),
    1 + lines.findLastIndex((line) => LineIsOnlyWhiteSpace(line) === false),
  );
}
function Split(text, delimiter, remove_empty_items = false) {
  const items = text.split(delimiter);
  return remove_empty_items === false ? items : items.filter((item) => item.length > 0);
}
function SplitLines(text, remove_empty_items = false) {
  return Split(text, /\r?\n/, remove_empty_items);
}

// src/lib/ericchase/Utility/PrepareMessage.ts
function PrepareMessage(message, left_margin_pad_size = 0, number_of_blank_lines_after = 0, number_of_blank_lines_before = 0) {
  const lines = RemoveWhiteSpaceOnlyLinesFromTopAndBottom(message);
  const out = lines.length > 0 ? [] : [''];
  for (let i = 0; i < number_of_blank_lines_before; i++) {
    out.push('');
  }
  let min_trim_size = GetLeftMarginSize(lines.at(0) ?? '');
  for (const line of lines.slice(1)) {
    if (LineIsOnlyWhiteSpace(line) === false) {
      min_trim_size = Math.min(min_trim_size, GetLeftMarginSize(line));
    }
  }
  const margin = ' '.repeat(left_margin_pad_size);
  for (const line of lines) {
    out.push(margin + line.slice(min_trim_size));
  }
  for (let i = 0; i < number_of_blank_lines_after; i++) {
    out.push('');
  }
  return out.join(`
`);
}

// src/lib/ericchase/Utility/Sleep.ts
async function Sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

// src/lib/ericchase/Web API/Node_Utility.ts
class CNodeRef {
  node;
  constructor(node) {
    if (node === null) {
      throw new ReferenceError('Reference is null.');
    }
    if (node === undefined) {
      throw new ReferenceError('Reference is undefined.');
    }
    this.node = node;
  }
  as(constructor_ref) {
    if (this.node instanceof constructor_ref) return this.node;
    throw new TypeError(`Reference node is not ${constructor_ref}`);
  }
  is(constructor_ref) {
    return this.node instanceof constructor_ref;
  }
  passAs(constructor_ref, fn) {
    if (this.node instanceof constructor_ref) {
      fn(this.node);
    }
  }
  tryAs(constructor_ref) {
    if (this.node instanceof constructor_ref) {
      return this.node;
    }
  }
  get classList() {
    return this.as(HTMLElement).classList;
  }
  get className() {
    return this.as(HTMLElement).className;
  }
  get style() {
    return this.as(HTMLElement).style;
  }
  getAttribute(qualifiedName) {
    return this.as(HTMLElement).getAttribute(qualifiedName);
  }
  setAttribute(qualifiedName, value) {
    this.as(HTMLElement).setAttribute(qualifiedName, value);
  }
  getStyleProperty(property) {
    return this.as(HTMLElement).style.getPropertyValue(property);
  }
  setStyleProperty(property, value, priority) {
    this.as(HTMLElement).style.setProperty(property, value, priority);
  }
}
class CNodeListRef extends Array {
  constructor(nodes) {
    if (nodes === null) {
      throw new ReferenceError('Reference list is null.');
    }
    if (nodes === undefined) {
      throw new ReferenceError('Reference list is undefined.');
    }
    super();
    for (const node of Array.from(nodes)) {
      try {
        this.push(new CNodeRef(node));
      } catch (_) {}
    }
  }
  as(constructor_ref) {
    return this.filter((ref) => ref.is(constructor_ref)).map((ref) => ref.as(constructor_ref));
  }
  passEachAs(constructor_ref, fn) {
    for (const ref of this) {
      ref.passAs(constructor_ref, fn);
    }
  }
}
function NodeListRef(nodes) {
  return new CNodeListRef(nodes);
}

// src/com.khinsider.Generate Album Downloader.user.ts
async function main() {
  const trackList = [];
  const jobQueue = new JobQueue(1000);
  jobQueue.subscribe((trackDetails, error) => {
    if (error) {
      console.log(error);
    }
    if (trackDetails) {
      trackList.push(trackDetails);
    }
  });
  new ElementAddedObserver({
    selector: 'table#songlist',
  }).subscribe(async (tableSonglist) => {
    if (tableSonglist instanceof HTMLTableElement) {
      for (const atag_song of NodeListRef(tableSonglist.querySelectorAll('.playlistDownloadSong > a')).as(HTMLAnchorElement)) {
        jobQueue.add(() => getSongUris(atag_song));
      }
      await jobQueue.done;
      generateDownloaderScript(trackList);
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
    const text = `
      import { mkdir } from 'node:fs/promises';
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
      }
    `;
    SaveText(PrepareMessage(text), `download_${albumName}.ts`);
  }
}
main();
