// ==UserScript==
// @name        *: Video Zoom
// @author      ericchase
// @namespace   ericchase
// @match       *://*/*
// @version     1.0.5
// @description 1/23/2022, 12:58:35 AM
// @run-at      document-start
// @grant       none
// @homepageURL https://github.com/ericchase/browser--userscripts
// ==/UserScript==

// Video Zoom
// Copyright © 2024 ericchase
// https://github.com/ericchase/browser--userscripts
// https://www.apache.org/licenses/LICENSE-2.0

var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) =>
  key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : (obj[key] = value);
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== 'symbol' ? key + '' : key, value);
function ConsumeEvent(e) {
  e.stopPropagation();
  e.preventDefault();
  e.stopImmediatePropagation();
}
function IsLeftClick(e) {
  return e.button === 0;
}
function PollForElement(query, ms) {
  return new Promise((resolve) => {
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
function Toggler(onEnable, onDisable) {
  let isEnabled = false;
  return (enable = void 0) => {
    if (isEnabled === enable) return;
    isEnabled = !isEnabled;
    isEnabled ? onEnable() : onDisable();
  };
}
const VIDEO_QUERY = 'video';
class Rect {
  constructor() {
    __publicField(this, 'x', 0);
    __publicField(this, 'y', 0);
    __publicField(this, 'width', 0);
    __publicField(this, 'height', 0);
    __publicField(this, 'top', 0);
    __publicField(this, 'right', 0);
    __publicField(this, 'bottom', 0);
    __publicField(this, 'left', 0);
  }
}
class Region {
  constructor() {
    __publicField(this, 'elem');
    __publicField(this, 'startPoint');
    __publicField(this, 'endPoint');
    this.elem = document.createElement('div');
    this.elem.style.position = 'absolute';
    this.elem.style.border = '2px solid red';
    this.elem.style.pointerEvents = 'none';
    this.elem.style.zIndex = '99999';
    this.startPoint = { x: 0, y: 0 };
    this.endPoint = { x: 0, y: 0 };
    document.documentElement.appendChild(this.elem);
    this.hide();
  }
  setStart(x, y) {
    this.startPoint.x = x;
    this.startPoint.y = y;
  }
  setEnd(x, y) {
    this.endPoint.x = x;
    this.endPoint.y = y;
  }
  drawRegion() {
    const rect = this.getRect();
    if (rect.width > 15 && rect.height > 15) {
      this.elem.style.left = rect.x + 'px';
      this.elem.style.top = rect.y + 'px';
      this.elem.style.width = rect.width + 'px';
      this.elem.style.height = rect.height + 'px';
      this.show();
    } else {
      this.elem.style.left = '0';
      this.elem.style.top = '0';
      this.elem.style.width = '0';
      this.elem.style.height = '0';
      this.hide();
    }
  }
  getRect() {
    let x1 = this.startPoint.x > this.endPoint.x ? this.endPoint.x : this.startPoint.x;
    let y1 = this.startPoint.y > this.endPoint.y ? this.endPoint.y : this.startPoint.y;
    let x2 = this.startPoint.x > this.endPoint.x ? this.startPoint.x : this.endPoint.x;
    let y2 = this.startPoint.y > this.endPoint.y ? this.startPoint.y : this.endPoint.y;
    return {
      x: x1,
      y: y1,
      width: x2 - x1,
      height: y2 - y1,
      left: x1,
      right: x2,
      top: y1,
      bottom: y2,
    };
  }
  show() {
    this.elem.style.display = 'block';
  }
  hide() {
    this.elem.style.display = 'none';
  }
}
class VideoHandler {
  constructor(elem) {
    __publicField(this, 'region', new Region());
    __publicField(this, 'zoomScale', 1);
    __publicField(this, 'zoomX', 0);
    __publicField(this, 'zoomY', 0);
    this.elem = elem;
    if (this.elem) {
      this.elem.style.transformOrigin = `0 0 0`;
    }
  }
  isClickedInside(evt) {
    if (this.elem && this.elem.offsetParent) {
      const { x, y } = this.elem.offsetParent.getBoundingClientRect();
      const left = x + this.elem.offsetLeft;
      const top = y + this.elem.offsetTop;
      const right = left + this.elem.offsetWidth;
      const bottom = top + this.elem.offsetHeight;
      return evt.clientX >= left && evt.clientX <= right && evt.clientY >= top && evt.clientY <= bottom;
    }
    return false;
  }
  getBoundingClientRect() {
    if (this.elem) {
      return this.elem.getBoundingClientRect();
    }
    return new Rect();
  }
  getRelativeCoords(x, y) {
    if (this.elem) {
      return {
        x: x - this.getBoundingClientRect().left + this.elem.offsetLeft,
        y: y - this.getBoundingClientRect().top + this.elem.offsetTop,
      };
    }
    return { x, y };
  }
  reset() {
    Log('VideoHandler.Reset');
    this.resetZoom();
    GetVideo();
  }
  applyZoom() {
    this.region.hide();
    if (this.elem) {
      Log('VideoHandler.applyZoom');
      const regionRect = this.region.getRect();
      const { x: relativeX, y: relativeY } = this.getRelativeCoords(regionRect.x, regionRect.y);
      const offset = { x: this.elem.offsetLeft, y: this.elem.offsetTop, width: this.elem.offsetWidth, height: this.elem.offsetHeight };
      const region = { x: relativeX, y: relativeY, width: regionRect.width, height: regionRect.height };
      const xScale = offset.width / region.width;
      const yScale = offset.height / region.height;
      this.zoomScale = xScale < yScale ? xScale : yScale;
      this.zoomX = region.x * this.zoomScale - (offset.width - region.width * this.zoomScale) / 2 - offset.x * this.zoomScale;
      this.zoomY = region.y * this.zoomScale - (offset.height - region.height * this.zoomScale) / 2 - offset.y * this.zoomScale;
      this.zoomX = this.zoomX < 0 ? 0 : -1 * this.zoomX;
      this.zoomY = this.zoomY < 0 ? 0 : -1 * this.zoomY;
      this.elem.style.transformOrigin = `0 0 0`;
      this.elem.style.scale = `${this.zoomScale}`;
      this.elem.style.translate = `${this.zoomX}px ${this.zoomY}px`;
    }
  }
  moveZoom(deltaX, deltaY) {
    if (this.elem) {
      Log('VideoHandler.moveZoom');
      this.zoomX += deltaX;
      this.zoomY += deltaY;
      this.elem.style.translate = `${this.zoomX}px ${this.zoomY}px`;
    }
  }
  resetZoom() {
    if (this.elem) {
      Log('VideoHandler.resetZoom');
      this.zoomScale = 1;
      this.elem.style.removeProperty('transformOrigin');
      this.elem.style.removeProperty('scale');
      this.elem.style.removeProperty('translate');
    }
  }
  get isZoomed() {
    return this.zoomScale !== 1;
  }
}
const mouseHandlers = {
  HandleMouse_Begin: Toggler(
    () => {
      window.addEventListener('mousedown', HandleMouse_Begin);
      window.addEventListener('mousedown', HandleMouse_Begin, true);
    },
    () => {
      window.removeEventListener('mousedown', HandleMouse_Begin);
      window.removeEventListener('mousedown', HandleMouse_Begin, true);
    },
  ),
  HandleMouse_End: Toggler(
    () => window.addEventListener('mouseup', HandleMouse_End, true),
    () => window.removeEventListener('mouseup', HandleMouse_End, true),
  ),
  HandleMouse_Move: Toggler(
    () => window.addEventListener('mousemove', HandleMouse_Move, true),
    () => window.removeEventListener('mousemove', HandleMouse_Move, true),
  ),
  HandleMouse_ResetZoom: Toggler(
    () => window.addEventListener('contextmenu', HandleMouse_ResetZoom, true),
    () => window.removeEventListener('contextmenu', HandleMouse_ResetZoom, true),
  ),
};
let videoHandler = new VideoHandler(void 0);
function GetVideo() {
  for (const toggle of Object.values(mouseHandlers)) {
    toggle(false);
  }
  Promise.all([PollForElement(VIDEO_QUERY, 250)]).then(([elem]) => {
    if (elem instanceof HTMLVideoElement && elem.isConnected && elem.style.display !== 'none') {
      Log('Setup VideoHandler');
      videoHandler = new VideoHandler(elem);
      mouseHandlers.HandleMouse_Begin(true);
    }
  });
}
GetVideo();
let oldClientX = 0;
let oldClientY = 0;
function HandleMouse_Begin(evt) {
  Log('HandleMouse_Begin');
  if (IsLeftClick(evt) && videoHandler.elem && videoHandler.isClickedInside(evt)) {
    if (evt.ctrlKey || evt.altKey) {
      ConsumeEvent(evt);
    }
    oldClientX = evt.clientX;
    oldClientY = evt.clientY;
    mouseHandlers.HandleMouse_End(true);
    mouseHandlers.HandleMouse_Move(true);
    if (!videoHandler.isZoomed) {
      videoHandler.region.setStart(evt.clientX, evt.clientY);
      videoHandler.region.setEnd(evt.clientX, evt.clientY);
    }
  }
}
function HandleMouse_Move(evt) {
  Log('HandleMouse_Move');
  if (videoHandler.isZoomed) {
    videoHandler.moveZoom(evt.clientX - oldClientX, evt.clientY - oldClientY);
    oldClientX = evt.clientX;
    oldClientY = evt.clientY;
  } else {
    videoHandler.region.setEnd(evt.clientX, evt.clientY);
    videoHandler.region.drawRegion();
  }
}
function HandleMouse_End(evt) {
  Log('HandleMouse_End');
  mouseHandlers.HandleMouse_End(false);
  mouseHandlers.HandleMouse_Move(false);
  const { width, height } = videoHandler.region.getRect();
  if (width > 15 && height > 15) {
    ConsumeEvent(evt);
    if (!videoHandler.isZoomed) {
      mouseHandlers.HandleMouse_ResetZoom(true);
      videoHandler.applyZoom();
    }
  }
}
function HandleMouse_ResetZoom(evt) {
  Log('HandleMouse_ResetZoom');
  if (videoHandler.isZoomed && videoHandler.isClickedInside(evt)) {
    ConsumeEvent(evt);
    mouseHandlers.HandleMouse_ResetZoom(false);
    videoHandler.resetZoom();
  }
}
function Log(...args) {
  console.info('%cVideo Zoom:', 'color: red', ...args);
}
Log('Loaded');
