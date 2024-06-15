import { ConsumeEvent, IsLeftClick } from './lib/Event.js';
import { PollForElement } from './lib/Observer.js';
import { Toggler } from './lib/Toggler.js';

const VIDEO_QUERY = 'video';

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
  top: number;
  right: number;
  bottom: number;
  left: number;
}
class Rect implements Rect {
  x = 0;
  y = 0;
  width = 0;
  height = 0;
  top = 0;
  right = 0;
  bottom = 0;
  left = 0;
}
class Region {
  elem: HTMLDivElement;
  startPoint: { x: number; y: number };
  endPoint: { x: number; y: number };

  constructor() {
    this.elem = document.createElement('div');
    this.elem.style.position = 'absolute';
    this.elem.style.border = '2px solid red';
    this.elem.style.pointerEvents = 'none';
    this.elem.style.zIndex = '99999';
    this.startPoint = { x: 0, y: 0 };
    this.endPoint = { x: 0, y: 0 };
    this.hide();
  }

  attach(sibling: HTMLElement) {
    sibling.insertAdjacentElement('afterend', this.elem);
  }

  setStart(this: Region, x: number, y: number) {
    this.startPoint.x = x;
    this.startPoint.y = y;
  }
  setEnd(this: Region, x: number, y: number) {
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

  getRect(this: Region): Rect {
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

  show(this: Region) {
    this.elem.style.display = 'block';
  }
  hide(this: Region) {
    this.elem.style.display = 'none';
  }
  reset(this: Region) {
    this.startPoint = { x: 0, y: 0 };
    this.endPoint = { x: 0, y: 0 };
    this.hide();
  }
}
class VideoHandler {
  region: Region = new Region();
  zoomScale = 1;
  zoomX = 0;
  zoomY = 0;
  constructor(public elem: HTMLVideoElement | undefined) {}
  isClickedInside(this: VideoHandler, evt: MouseEvent) {
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
  getBoundingClientRect(this: VideoHandler): Rect {
    if (this.elem) {
      return this.elem.getBoundingClientRect();
    }
    return new Rect();
  }
  getRelativeCoords(this: VideoHandler, x: number, y: number) {
    if (this.elem) {
      return {
        x: x - this.getBoundingClientRect().left + this.elem.offsetLeft,
        y: y - this.getBoundingClientRect().top + this.elem.offsetTop,
      };
    }
    return { x: x, y: y };
  }
  reset(this: VideoHandler) {
    Log('VideoHandler.Reset');
    this.resetZoom();
    GetVideo();
  }

  applyZoom(this: VideoHandler) {
    this.region.hide();
    if (this.elem) {
      Log('VideoHandler.applyZoom');
      const regionRect = this.region.getRect();
      const offset = { x: this.elem.offsetLeft, y: this.elem.offsetTop, width: this.elem.offsetWidth, height: this.elem.offsetHeight };
      const region = { x: regionRect.x, y: regionRect.y, width: regionRect.width, height: regionRect.height };

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

      this.elem.style.transformOrigin = `0 0 0`;
      this.elem.style.scale = `${this.zoomScale}`;
      this.elem.style.translate = `${this.zoomX}px ${this.zoomY}px`;
    }
  }
  moveZoom(this: VideoHandler, deltaX: number, deltaY: number) {
    if (this.elem) {
      Log('VideoHandler.moveZoom');
      this.zoomX += deltaX;
      this.zoomY += deltaY;
      this.elem.style.translate = `${this.zoomX}px ${this.zoomY}px`;
    }
  }
  resetZoom(this: VideoHandler) {
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

function GetVideo() {
  // reset mouse handlers
  for (const toggle of Object.values(mouseHandlers)) {
    toggle(false);
  }
  // look for video element
  Promise.all([PollForElement(VIDEO_QUERY, 250)]).then(([elem]) => {
    if (elem instanceof HTMLVideoElement && elem.isConnected && elem.style.display !== 'none') {
      Log('Setup VideoHandler');
      videoHandler = new VideoHandler(elem);
      mouseHandlers.HandleMouse_Begin(true);
    }
  });
}
GetVideo();

let consumeNextClick = false;
let oldClientX = 0;
let oldClientY = 0;
function HandleMouse_Begin(evt: MouseEvent) {
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
      videoHandler.region.attach(videoHandler.elem);
      const { x, y } = videoHandler.getRelativeCoords(evt.clientX, evt.clientY);
      videoHandler.region.setStart(x, y);
      videoHandler.region.setEnd(x, y);
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
    videoHandler.region.setEnd(x, y);
    videoHandler.region.drawRegion();
  }
}
function HandleMouse_End(evt: MouseEvent) {
  Log('HandleMouse_End');
  mouseHandlers.HandleMouse_End(false);
  mouseHandlers.HandleMouse_Move(false);
  const { width, height } = videoHandler.region.getRect();
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
  if (IsLeftClick(evt) && videoHandler.elem && videoHandler.isClickedInside(evt)) {
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

function Log(...args: any[]) {
  if (true) console.info('%cVideo Zoom:', 'color: red', ...args);
}
Log('Loaded');
