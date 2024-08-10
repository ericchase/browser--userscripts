const header = `
// ==UserScript==
// @name        *: Video Zoom
// @author      ericchase
// @namespace   ericchase
// @match       *://*/*
// @version     1.0.8
// @description 2022/01/23, 12:58:35 AM
// @run-at      document-end
// @grant       none
// @homepageURL https://github.com/ericchase/browser--userscripts
// ==/UserScript==

// Video Zoom
// Copyright © 2024 ericchase
// https://github.com/ericchase/browser--userscripts
// https://www.apache.org/licenses/LICENSE-2.0
`;

import { ToAdjustedEm, ToRelativeEm, ToRelativePx } from './lib/external/Platform/Web/CSS/Size.js';
import { ElementAddedObserver } from './lib/external/Platform/Web/DOM/MutationObserver/ElementAddedObserver.js';
import { RegionHighlighter } from './lib/external/Platform/Web/RegionHighlighter.js';
import { Rect } from './lib/external/Utility/Rect.js';

function PollForElement(query: string, ms: number) {
  return new Promise<HTMLElement>((resolve) => {
    (function search() {
      for (const el of document.querySelectorAll(query)) {
        if (el instanceof HTMLElement && el.style.display !== 'none') {
          return resolve(el);
        }
      }
      setTimeout(search, ms);
    })();
  });
}

class VideoHandler {
  region: RegionHighlighter;

  zoomScale = 1;
  zoomX = 0;
  zoomY = 0;

  constructor(public element: HTMLVideoElement | undefined) {
    this.region = new RegionHighlighter({ width: `${Math.max(ToRelativeEm(0.125, element), ToAdjustedEm(0.125, element))}em` });
  }

  isClickedInside(this: VideoHandler, mouseEvent: MouseEvent) {
    if (this.element && this.element.offsetParent) {
      const { x, y } = this.element.offsetParent.getBoundingClientRect();
      const left = x + this.element.offsetLeft;
      const top = y + this.element.offsetTop;
      const right = left + this.element.offsetWidth;
      const bottom = top + this.element.offsetHeight;
      return mouseEvent.clientX >= left && mouseEvent.clientX <= right && mouseEvent.clientY >= top && mouseEvent.clientY <= bottom;
    }
    return false;
  }

  getBoundingClientRect(this: VideoHandler): Rect {
    return this.element ? Rect.fromRect(this.element.getBoundingClientRect()) : new Rect();
  }

  getRelativeCoords(this: VideoHandler, x: number, y: number) {
    if (this.element) {
      return {
        x: x - this.getBoundingClientRect().left + this.element.offsetLeft,
        y: y - this.getBoundingClientRect().top + this.element.offsetTop,
      };
    }
    return { x: x, y: y };
  }
  reset(this: VideoHandler) {
    Log('VideoHandler.Reset');
    this.resetZoom();
  }

  applyZoom(this: VideoHandler) {
    this.region.hide();
    if (this.element) {
      Log('VideoHandler.applyZoom');
      const { x, y, width, height } = this.region.rect;
      const offset = { x: this.element.offsetLeft, y: this.element.offsetTop, width: this.element.offsetWidth, height: this.element.offsetHeight };
      const region = { x, y, width, height };

      // get ratios of video size / rectangle size
      const xScale = offset.width / region.width;
      const yScale = offset.height / region.height;
      // choose the smaller scale
      this.zoomScale = xScale < yScale ? xScale : yScale;

      // calculate the zoom coordinates
      this.zoomX = region.x * this.zoomScale - (offset.width - region.width * this.zoomScale) / 2 - offset.x * this.zoomScale;
      this.zoomY = region.y * this.zoomScale - (offset.height - region.height * this.zoomScale) / 2 - offset.y * this.zoomScale;

      this.zoomX = this.zoomX < 0 ? 0 : -1 * this.zoomX;
      this.zoomY = this.zoomY < 0 ? 0 : -1 * this.zoomY;

      this.element.style.transformOrigin = `0 0 0`;
      this.element.style.scale = `${this.zoomScale}`;
      this.element.style.translate = `${this.zoomX}px ${this.zoomY}px`;
    }
  }
  moveZoom(this: VideoHandler, deltaX: number, deltaY: number) {
    if (this.element) {
      Log('VideoHandler.moveZoom');
      this.zoomX += deltaX;
      this.zoomY += deltaY;
      this.element.style.translate = `${this.zoomX}px ${this.zoomY}px`;
    }
  }
  resetZoom(this: VideoHandler) {
    if (this.element) {
      Log('VideoHandler.resetZoom');
      this.zoomScale = 1;
      this.element.style.removeProperty('transformOrigin');
      this.element.style.removeProperty('scale');
      this.element.style.removeProperty('translate');
    }
  }

  get isZoomed() {
    return this.zoomScale !== 1;
  }
}

async function main() {
  const videoObserver = new ElementAddedObserver({
    source: document,
    selector: 'video',
  });

  videoObserver.subscribe((video) => {
    if (video instanceof HTMLVideoElement) {
      return { abort: true };
    }
  });
}

function GetVideo() {
  // reset mouse handlers
  for (const toggle of Object.values(mouseHandlers)) {
    toggle(false);
  }
  // look for video element
  Promise.all([PollForElement('video', 250)]).then(([elem]) => {
    if (elem instanceof HTMLVideoElement && elem.isConnected && elem.style.display !== 'none') {
      Log('Setup VideoHandler');
      videoHandler = new VideoHandler(elem);
      mouseHandlers.HandleMouse_Begin(true);
    }
  });
}

function ConsumeEvent(e: Event) {
  e.preventDefault();
  e.stopImmediatePropagation();
  e.stopPropagation();
}

function IsLeftClick(e: MouseEvent) {
  return e.button === 0;
}

function Toggler(onEnable: () => void, onDisable: () => void) {
  let isEnabled = false;
  return (enable: any = undefined) => {
    if (isEnabled === enable) return;
    isEnabled = !isEnabled;
    isEnabled ? onEnable() : onDisable();
  };
}

const mouseHandlers = {
  HandleMouse_Begin: Toggler(
    () => {
      window.addEventListener('mousedown', HandleMouse_Begin);
      window.addEventListener('mousedown', HandleMouse_Begin, true);
      window.addEventListener('click', HandleClick);
      window.addEventListener('click', HandleClick, true);
    },
    () => {
      window.removeEventListener('mousedown', HandleMouse_Begin);
      window.removeEventListener('mousedown', HandleMouse_Begin, true);
      window.removeEventListener('click', HandleClick);
      window.removeEventListener('click', HandleClick, true);
    },
  ),
  HandleMouse_Move: Toggler(
    () => window.addEventListener('mousemove', HandleMouse_Move, true),
    () => window.removeEventListener('mousemove', HandleMouse_Move, true),
  ),
  HandleMouse_End: Toggler(
    () => {
      window.addEventListener('mouseup', HandleMouse_End);
      window.addEventListener('mouseup', HandleMouse_End, true);
    },
    () => {
      window.removeEventListener('mouseup', HandleMouse_End);
      window.removeEventListener('mouseup', HandleMouse_End, true);
    },
  ),
  HandleMouse_ResetZoom: Toggler(
    () => window.addEventListener('contextmenu', HandleMouse_ResetZoom, true),
    () => window.removeEventListener('contextmenu', HandleMouse_ResetZoom, true),
  ),
};

let videoHandler = new VideoHandler(undefined);

let consumeNextClick = false;
let oldClientX = 0;
let oldClientY = 0;
function HandleMouse_Begin(evt: MouseEvent) {
  Log('HandleMouse_Begin');
  if (IsLeftClick(evt) && videoHandler.element && videoHandler.isClickedInside(evt)) {
    if (evt.ctrlKey || evt.altKey) {
      ConsumeEvent(evt);
    }
    oldClientX = evt.clientX;
    oldClientY = evt.clientY;
    mouseHandlers.HandleMouse_End(true);
    mouseHandlers.HandleMouse_Move(true);
    if (!videoHandler.isZoomed) {
      videoHandler.region.attach(videoHandler.element);
      const { x, y } = videoHandler.getRelativeCoords(evt.clientX, evt.clientY);
      console.log();
      console.log('absolute coord:', evt.clientX, evt.clientY);
      console.log('relative coord:', x, y);
      console.log('video element:', videoHandler.element, 'region element:', videoHandler.region.element);
      console.log();
      videoHandler.region.rect.x1 = videoHandler.region.rect.x2 = x;
      videoHandler.region.rect.y1 = videoHandler.region.rect.y2 = y;
    }
  }
}
function HandleMouse_Move(evt: MouseEvent) {
  Log('HandleMouse_Move');
  if (videoHandler.isZoomed) {
    if (oldClientX !== evt.clientX || oldClientY !== evt.clientY) {
      consumeNextClick = true;
      videoHandler.moveZoom(evt.clientX - oldClientX, evt.clientY - oldClientY);
      oldClientX = evt.clientX;
      oldClientY = evt.clientY;
    }
  } else {
    const { x, y } = videoHandler.getRelativeCoords(evt.clientX, evt.clientY);
    videoHandler.region.rect.x2 = x;
    videoHandler.region.rect.y2 = y;
    videoHandler.region.draw();
  }
}
function HandleMouse_End(evt: MouseEvent) {
  Log('HandleMouse_End');
  mouseHandlers.HandleMouse_End(false);
  mouseHandlers.HandleMouse_Move(false);
  const { width, height } = videoHandler.region.rect;
  if (width > 15 && height > 15) {
    ConsumeEvent(evt);
    if (!videoHandler.isZoomed) {
      mouseHandlers.HandleMouse_ResetZoom(true);
      videoHandler.applyZoom();
      consumeNextClick = true;
    }
  }
  videoHandler.region.reset();
}
function HandleClick(evt: MouseEvent) {
  Log('HandleClick');
  if (IsLeftClick(evt) && videoHandler.element && videoHandler.isClickedInside(evt)) {
    if (consumeNextClick || evt.ctrlKey || evt.altKey) {
      consumeNextClick = false;
      ConsumeEvent(evt);
    }
  }
}

function HandleMouse_ResetZoom(evt: MouseEvent) {
  Log('HandleMouse_ResetZoom');
  if (videoHandler.isZoomed && videoHandler.isClickedInside(evt)) {
    ConsumeEvent(evt);
    mouseHandlers.HandleMouse_ResetZoom(false);
    videoHandler.resetZoom();
  }
}

GetVideo();
// main();

function Log(...args: any[]) {
  if (true) console.info('%cVideo Zoom:', 'color: red', ...args);
}
Log('Loaded');
