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

// src/@/Video Zoom/src/lib/Event.ts
function ConsumeEvent(e) {
  e.preventDefault();
  e.stopImmediatePropagation();
  e.stopPropagation();
}

// src/lib/external/Platform/Web/CSS/Size.ts
function ToAdjustedEm(em, root = document.documentElement) {
  const fontSizePx = Number.parseInt(getComputedStyle(root).fontSize);
  return (16 / fontSizePx) * em;
}
function ToRelativeEm(em, root = document.documentElement) {
  const fontSizePx = Number.parseInt(getComputedStyle(root).fontSize);
  return (fontSizePx / 16) * em;
}

// src/lib/external/Platform/Web/DOM/Element/Visibility.ts
function IsVisible(element) {
  const styles = window.getComputedStyle(element);
  if (styles.display === 'none') return false;
  if (styles.visibility === 'hidden' || styles.visibility === 'collapse') return false;
  const { width, height } = element.getBoundingClientRect();
  if (width <= 0 || height <= 0) return false;
  return true;
}

// src/lib/external/Platform/Web/DOM/MutationObserver/ElementAdded.ts
class ElementAddedObserver {
  constructor({ source = document.documentElement, options = { subtree: true }, selector, includeExistingElements = true }) {
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

// src/lib/external/Utility/Rect.ts
class Rect {
  x1 = 0;
  x2 = 0;
  y1 = 0;
  y2 = 0;
  static fromRect(rect) {
    const r = new Rect();
    r.x1 = rect.x ?? 0;
    r.y1 = rect.y ?? 0;
    r.x2 = r.x1 + (rect.width ?? 0);
    r.y2 = r.y1 + (rect.height ?? 0);
    return r;
  }
  toRectReadOnly() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      left: this.left,
      top: this.top,
      right: this.right,
      bottom: this.bottom,
    };
  }
  get xs() {
    return this.x1 <= this.x2 ? [this.x1, this.x2] : [this.x2, this.x1];
  }
  get ys() {
    return this.y1 <= this.y2 ? [this.y1, this.y2] : [this.y2, this.y1];
  }
  get x() {
    return this.xs[0];
  }
  get y() {
    return this.ys[0];
  }
  get width() {
    const [min, max] = this.xs;
    return max - min;
  }
  get height() {
    const [min, max] = this.ys;
    return max - min;
  }
  get left() {
    return this.xs[0];
  }
  get top() {
    return this.ys[0];
  }
  get right() {
    return this.xs[1];
  }
  get bottom() {
    return this.ys[1];
  }
  set x(x) {
    if (this.x1 <= this.x2) {
      this.x1 = x;
    } else {
      this.x2 = x;
    }
  }
  set y(y) {
    if (this.y1 <= this.y2) {
      this.y1 = y;
    } else {
      this.y2 = y;
    }
  }
  set width(width) {
    if (this.x1 <= this.x2) {
      this.x2 = this.x1 + width;
    } else {
      this.x1 = this.x2 + width;
    }
  }
  set height(height) {
    if (this.y1 <= this.y2) {
      this.y2 = this.y1 + height;
    } else {
      this.y1 = this.y2 + height;
    }
  }
  set left(left) {
    this.x = left;
  }
  set top(top) {
    this.y = top;
  }
  set right(right) {
    if (this.x1 <= this.x2) {
      this.x2 = right;
    } else {
      this.x1 = right;
    }
  }
  set bottom(bottom) {
    if (this.y1 <= this.y2) {
      this.y2 = bottom;
    } else {
      this.y1 = bottom;
    }
  }
}

// src/lib/external/Platform/Web/RegionHighlighter.ts
class RegionHighlighter {
  element = document.createElement('div');
  rect = new Rect();
  constructor({ width = '', style = '', color = '' } = {}) {
    if (width !== '') this.element.style.setProperty('border-width', width);
    if (style !== '') this.element.style.setProperty('border-style', style);
    if (color !== '') this.element.style.setProperty('border-color', color);
    if (this.element.style.getPropertyValue('border-width') === '') this.element.style.setProperty('border-width', '0.125em');
    if (this.element.style.getPropertyValue('border-style') === '') this.element.style.setProperty('border-style', 'solid');
    if (this.element.style.getPropertyValue('border-color') === '') this.element.style.setProperty('border-color', 'red');
    this.element.style.position = 'absolute';
    this.element.style.pointerEvents = 'none';
    this.element.style.zIndex = '99999';
    this.hide();
  }
  attach(sibling) {
    sibling.insertAdjacentElement('afterend', this.element);
  }
  draw() {
    const { x, y, width, height } = this.rect;
    if (width > 15 && height > 15) {
      this.element.style.left = x + 'px';
      this.element.style.top = y + 'px';
      this.element.style.width = width + 'px';
      this.element.style.height = height + 'px';
      this.show();
    } else {
      this.element.style.left = '0';
      this.element.style.top = '0';
      this.element.style.width = '0';
      this.element.style.height = '0';
      this.hide();
    }
  }
  hide() {
    this.element.style.setProperty('display', 'none');
  }
  reset() {
    this.hide();
    this.rect.x1 = 0;
    this.rect.x2 = 0;
    this.rect.y1 = 0;
    this.rect.y2 = 0;
  }
  show() {
    this.element.style.removeProperty('display');
  }
}

// src/@.Video Zoom.user.ts
async function main() {
  for (const toggle of Object.values(mouseHandlers)) {
    toggle(false);
  }
  const videoObserver = new ElementAddedObserver({
    selector: 'video',
  });
  videoObserver.subscribe((element) => {
    if (element instanceof HTMLVideoElement && element.isConnected && IsVisible(element)) {
      Log('Setup VideoHandler');
      videoHandler = new VideoHandler(element);
      mouseHandlers.HandleMouse_Begin(true);
      return { abort: true };
    }
  });
}
function IsLeftClick(e) {
  return e.button === 0;
}
function Toggler(onEnable, onDisable) {
  let isEnabled = false;
  return (enable = undefined) => {
    if (isEnabled === enable) return;
    isEnabled = !isEnabled;
    isEnabled ? onEnable() : onDisable();
  };
}
function HandleMouse_Begin(evt) {
  Log('HandleMouse_Begin');
  if (evt instanceof MouseEvent) {
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
        videoHandler.region.rect.x1 = videoHandler.region.rect.x2 = x;
        videoHandler.region.rect.y1 = videoHandler.region.rect.y2 = y;
      }
    }
  }
}
function HandleMouse_Move(evt) {
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
function HandleMouse_End(evt) {
  Log('HandleMouse_End');
  if (evt instanceof MouseEvent) {
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
}
function HandleClick(evt) {
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
function HandleMouse_ResetZoom(evt) {
  Log('HandleMouse_ResetZoom');
  if (evt instanceof MouseEvent) {
    if (videoHandler.isZoomed && videoHandler.isClickedInside(evt)) {
      ConsumeEvent(evt);
      mouseHandlers.HandleMouse_ResetZoom(false);
      videoHandler.resetZoom();
    }
  }
}
function Log(...args) {
  if (true) console.info('%cVideo Zoom:', 'color: red', ...args);
}
class VideoHandler {
  element;
  region;
  zoomScale = 1;
  zoomX = 0;
  zoomY = 0;
  constructor(element) {
    this.element = element;
    this.region = new RegionHighlighter({ width: `${Math.max(ToRelativeEm(0.125, element), ToAdjustedEm(0.125, element))}em` });
  }
  isClickedInside(mouseEvent) {
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
  getBoundingClientRect() {
    if (this.element) {
      return Rect.fromRect(this.element.getBoundingClientRect());
    }
    return new Rect();
  }
  getRelativeCoords(x, y) {
    if (this.element) {
      return {
        x: x - this.getBoundingClientRect().left + this.element.offsetLeft,
        y: y - this.getBoundingClientRect().top + this.element.offsetTop,
      };
    }
    return { x, y };
  }
  reset() {
    Log('VideoHandler.Reset');
    this.resetZoom();
  }
  applyZoom() {
    this.region.hide();
    if (this.element) {
      Log('VideoHandler.applyZoom');
      const { x, y, width, height } = this.region.rect;
      const offset = { x: this.element.offsetLeft, y: this.element.offsetTop, width: this.element.offsetWidth, height: this.element.offsetHeight };
      const region = { x, y, width, height };
      const xScale = offset.width / region.width;
      const yScale = offset.height / region.height;
      this.zoomScale = xScale < yScale ? xScale : yScale;
      this.zoomX = region.x * this.zoomScale - (offset.width - region.width * this.zoomScale) / 2 - offset.x * this.zoomScale;
      this.zoomY = region.y * this.zoomScale - (offset.height - region.height * this.zoomScale) / 2 - offset.y * this.zoomScale;
      this.zoomX = this.zoomX < 0 ? 0 : -1 * this.zoomX;
      this.zoomY = this.zoomY < 0 ? 0 : -1 * this.zoomY;
      this.element.style.transformOrigin = `0 0 0`;
      this.element.style.scale = `${this.zoomScale}`;
      this.element.style.translate = `${this.zoomX}px ${this.zoomY}px`;
    }
  }
  moveZoom(deltaX, deltaY) {
    if (this.element) {
      Log('VideoHandler.moveZoom');
      this.zoomX += deltaX;
      this.zoomY += deltaY;
      this.element.style.translate = `${this.zoomX}px ${this.zoomY}px`;
    }
  }
  resetZoom() {
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
var mouseHandlers = {
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
var videoHandler = new VideoHandler(undefined);
var consumeNextClick = false;
var oldClientX = 0;
var oldClientY = 0;
Log('Loaded');
main();
