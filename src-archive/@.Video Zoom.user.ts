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

import { ToAdjustedEm, ToRelativeEm } from '../src/lib/ericchase/Platform/Web/CSS/Size.js';
import { IsVisible } from '../src/lib/ericchase/Platform/Web/DOM/Element/Visibility.js';
import { ElementAddedObserver } from '../src/lib/ericchase/Platform/Web/DOM/MutationObserver/ElementAdded.js';
import { ConsumeEvent } from '../src/lib/ericchase/Platform/Web/Event/Consume.js';
import { RegionHighlighter } from '../src/lib/ericchase/Platform/Web/RegionHighlighter.js';
import { Rect } from '../src/lib/ericchase/Utility/Rect.js';

class VideoHandler {
  region: RegionHighlighter;

  zoomScale = 1;
  zoomX = 0;
  zoomY = 0;

  constructor(public element: HTMLVideoElement | undefined) {
    this.region = new RegionHighlighter({ width: `${Math.max(ToRelativeEm(0.125, element), ToAdjustedEm(0.125, element))}em` });
  }

  isClickedInside(this: VideoHandler, mouseEvent: MouseEvent) {
    if (this.element?.offsetParent) {
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
    if (this.element) {
      return Rect.fromRect(this.element.getBoundingClientRect());
    }
    return new Rect();
  }

  getRelativeCoords(this: VideoHandler, x: number, y: number) {
    if (this.element) {
      return {
        x: x - this.getBoundingClientRect().left + this.element.offsetLeft,
        y: y - this.getBoundingClientRect().top + this.element.offsetTop,
      };
    }
    return { x, y };
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

      this.element.style.transformOrigin = '0 0 0';
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

// EventManager.subscribe(() => {}, window, 'click');

// const evg_window = EventManager.new(window).addGroups({
//   mouseBegin: [
//     ['click', HandleClick, ['bubbles', 'capture']],
//     ['mousedown', HandleMouse_Begin, ['bubbles', 'capture']],
//   ],
//   mouseMoveEnd: [
//     ['mousemove', HandleMouse_Move, 'capture'],
//     ['mouseup', HandleMouse_End, ['bubbles', 'capture']],
//   ],
//   resetZoom: [
//     ['contextmenu', HandleMouse_ResetZoom, ['capture']], //
//   ],
// });

// const e1 = new EventListener(window, 'click', () => {}, []);
// const e2 = new EventListener(window, 'click', () => {}, []);
// const e3 = new EventListener(window, 'click', () => {}, []);

// e1.enable();
// e1.disable();

// const g1 = new EventListenerGroup().add(e1, e2, e3);

// g1.enable();
// g1.disable();

async function main() {
  const videoObserver = new ElementAddedObserver({
    selector: 'video',
  });

  videoObserver.subscribe((element) => {
    if (element instanceof HTMLVideoElement && element.isConnected && IsVisible(element)) {
      Log('Setup VideoHandler');
      videoHandler = new VideoHandler(element);
      // eg_MouseBegin.enable();
      evg_window.mouseBegin.enable();
      return { abort: true };
    }
  });
}

let videoHandler = new VideoHandler(undefined);

let consumeNextClick = false;
let oldClientX = 0;
let oldClientY = 0;
function HandleMouse_Begin(evt: Event) {
  Log('HandleMouse_Begin');
  if (evt instanceof MouseEvent) {
    if (IsLeftClick(evt) && videoHandler.element && videoHandler.isClickedInside(evt)) {
      if (evt.ctrlKey || evt.altKey) {
        ConsumeEvent(evt);
      }
      oldClientX = evt.clientX;
      oldClientY = evt.clientY;
      evg_window.mouseMoveEnd.enable();
      if (!videoHandler.isZoomed) {
        videoHandler.region.attach(videoHandler.element);
        const { x, y } = videoHandler.getRelativeCoords(evt.clientX, evt.clientY);
        videoHandler.region.rect.x1 = videoHandler.region.rect.x2 = x;
        videoHandler.region.rect.y1 = videoHandler.region.rect.y2 = y;
      }
    }
  }
}
function HandleMouse_Move(evt: Event) {
  Log('HandleMouse_Move');
  if (evt instanceof MouseEvent) {
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
}
function HandleMouse_End(evt: Event) {
  Log('HandleMouse_End');
  if (evt instanceof MouseEvent) {
    // eg_MouseMoveEnd.disable();
    evg_window.mouseMoveEnd.disable();
    const { width, height } = videoHandler.region.rect;
    if (width > 15 && height > 15) {
      ConsumeEvent(evt);
      if (!videoHandler.isZoomed) {
        // eg_ResetZoom.enable();
        evg_window.resetZoom.enable();
        videoHandler.applyZoom();
        consumeNextClick = true;
      }
    }
    videoHandler.region.reset();
  }
}
function HandleClick(evt: Event) {
  Log('HandleClick');
  if (evt instanceof MouseEvent) {
    if (IsLeftClick(evt) && videoHandler.element && videoHandler.isClickedInside(evt)) {
      if (consumeNextClick || evt.ctrlKey || evt.altKey) {
        consumeNextClick = false;
        ConsumeEvent(evt);
      }
    }
  }
}

function HandleMouse_ResetZoom(evt: Event) {
  Log('HandleMouse_ResetZoom');
  if (evt instanceof MouseEvent) {
    if (videoHandler.isZoomed && videoHandler.isClickedInside(evt)) {
      ConsumeEvent(evt);
      // eg_ResetZoom.disable();
      evg_window.resetZoom.disable();
      videoHandler.resetZoom();
    }
  }
}

function IsLeftClick(e: MouseEvent) {
  return e.button === 0;
}

function Log(...args: any[]) {
  console.info('%cVideo Zoom:', 'color: red', ...args);
}
Log('Loaded');

main();
