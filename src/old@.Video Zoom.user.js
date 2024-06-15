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

const VIDEO_QUERY = 'video';

/**
 * @typedef RegionRect
 * @property {number} x
 * @property {number} y
 * @property {number} width
 * @property {number} height
 */
class Region {
  /**
   * @param {HTMLElement} sibling
   * @memberof Region
   */
  constructor(sibling) {
    this.el = document.createElement('div');
    this.el.style.position = 'absolute';
    this.el.style.border = '2px solid red';
    this.el.style.pointerEvents = 'none';
    sibling.insertAdjacentElement('afterend', this.el);

    this.startPoint = { x: 0, y: 0 };
    this.endPoint = { x: 0, y: 0 };
    this.hide();
  }

  /**
   * @param {number} x
   * @param {number} y
   * @memberof Region
   */
  setStart(x, y) {
    this.startPoint.x = x;
    this.startPoint.y = y;
    this.endPoint.x = x;
    this.endPoint.y = y;
  }
  /**
   * @param {number} x
   * @param {number} y
   * @memberof Region
   */
  setEnd(x, y) {
    this.endPoint.x = x;
    this.endPoint.y = y;
  }

  /**
   * @param {number} x2
   * @param {number} y2
   * @memberof Region
   */
  drawRect(x2, y2) {
    this.endPoint.x = x2;
    this.endPoint.y = y2;

    const rect = this.getRect();
    if (rect.width > 15 && rect.height > 15) {
      this.el.style.left = rect.x + 'px';
      this.el.style.top = rect.y + 'px';
      this.el.style.width = rect.width + 'px';
      this.el.style.height = rect.height + 'px';
      this.show();
    } else {
      this.el.style.left = '0';
      this.el.style.top = '0';
      this.el.style.width = '0';
      this.el.style.height = '0';
      this.hide();
    }
  }

  /**
   * @return {RegionRect}
   * @memberof Region
   */
  getRect() {
    let x1 = this.startPoint.x > this.endPoint.x ? this.endPoint.x : this.startPoint.x;
    let y1 = this.startPoint.y > this.endPoint.y ? this.endPoint.y : this.startPoint.y;
    let x2 = this.startPoint.x > this.endPoint.x ? this.startPoint.x : this.endPoint.x;
    let y2 = this.startPoint.y > this.endPoint.y ? this.startPoint.y : this.endPoint.y;
    return {
      x: x1 ?? 0,
      y: y1 ?? 0,
      width: x2 - x1 ?? 0,
      height: y2 - y1 ?? 0,
    };
  }

  show() {
    this.el.style.display = 'block';
  }

  hide() {
    this.el.style.display = 'none';
  }
}

/**
 * @param {HTMLVideoElement} video
 * @param {RegionRect} rect
 */
function ApplyZoomToRect(video, rect) {
  const v = { x: video.offsetLeft, y: video.offsetTop, w: video.offsetWidth, h: video.offsetHeight };
  const r = { x: rect.x, y: rect.y, w: rect.width, h: rect.height };

  // get ratios of rectangle size to video size
  // choose the smaller scale
  const xScale = v.w / r.w;
  const yScale = v.h / r.h;
  const scale = xScale < yScale ? xScale : yScale;

  // calculate the new coordinates
  let newX = r.x * scale - (v.w - r.w * scale) / 2 - v.x * scale;
  let newY = r.y * scale - (v.h - r.h * scale) / 2 - v.y * scale;
  if (newX < 0) newX = 0;
  if (newY < 0) newY = 0;

  // video.style.transform = `translate(-${newX}px, -${newY}px) scale(${scale})`;
  video.style.scale = scale;
  video.style.translate = `-${newX}px -${newY}px`;

  {
    const { x, y, width, height } = video.getBoundingClientRect();
    console.log('x', x, x / scale);
    console.log('y', y, y / scale);
    console.log('width', width, width / scale);
    console.log('height', height, height / scale);
  }
}
/**
 * @param {HTMLVideoElement} video
 */
function ResetVideoZoom(video) {
  video.style.removeProperty('scale');
  video.style.removeProperty('translate');
}

/**
 * @param {HTMLVideoElement} video
 */
function Setup(video) {
  Log('Setup');

  const region = new Region(video);

  /**
   * @typedef {object} Data
   * @property {boolean} data.didZoom
   * @property {boolean} data.isZoomed
   * @property {boolean} data.isZooming
   * @property {DOMRect|null} videoRect
   */

  /** @type {Data} */
  const data = {
    didZoom: false,
    isZoomed: false,
    isZooming: false,
    videoRect: null,
  };

  const toggles = {
    ClickVideoBegin: Toggler(
      () => {
        window.addEventListener('mousedown', ClickVideoBegin);
        window.addEventListener('mousedown', ClickVideoBegin, true);
      },
      () => {
        window.removeEventListener('mousedown', ClickVideoBegin);
        window.removeEventListener('mousedown', ClickVideoBegin, true);
      },
    ),
    ClickVideoEnd: Toggler(
      () => {
        window.addEventListener('mouseup', ClickVideoEnd, true);
      },
      () => {
        window.removeEventListener('mouseup', ClickVideoEnd, true);
      },
    ),
    ClickVideoMove: Toggler(
      () => {
        window.addEventListener('mousemove', ClickVideoMove, true);
      },
      () => {
        window.removeEventListener('mousemove', ClickVideoMove, true);
      },
    ),
    ResetZoom: Toggler(
      () => {
        window.addEventListener('contextmenu', ResetZoom, true);
      },
      () => {
        window.removeEventListener('contextmenu', ResetZoom, true);
      },
    ),
    StopClickWhenZoomed: Toggler(
      () => {
        window.addEventListener('click', StopClickWhenZoomed, true);
      },
      () => {
        window.removeEventListener('click', StopClickWhenZoomed, true);
      },
    ),
  };

  toggles.ClickVideoBegin(true);

  video.style.transformOrigin = `0 0 0`;

  // Helpers

  function CleanUp() {
    Log('CleanUp');
    video.style.removeProperty('transform');
    video.style.removeProperty('transformOrigin');
    // remove listeners
    for (const toggle of Object.values(toggles)) {
      toggle(false);
    }
    // start over
    GetVideo();
  }

  /** @param {MouseEvent} evt */
  function getTranslatedCoords(evt) {
    if (data.videoRect) {
      return {
        x: evt.clientX - data.videoRect.left + video.offsetLeft, //
        y: evt.clientY - data.videoRect.top + video.offsetTop,
      };
    }
    return { x: evt.clientX, y: evt.clientY };
  }

  // Listeners

  /** @param {MouseEvent} evt */
  function ClickVideoBegin(evt) {
    if (!VideoIsValid(video)) {
      CleanUp();
      return;
    }
    if (!IsLeftClick(evt) || !ClickedInside(video, evt)) {
      return;
    }
    Log('ClickVideoBegin');
    if (evt.target === video) {
      ConsumeEvent(evt);
    }
    toggles.ClickVideoEnd(true);
    toggles.ClickVideoMove(true);
    if (!data.isZoomed) {
      data.isZooming = true;
      data.videoRect = video.getBoundingClientRect();
    }
    const { x, y } = getTranslatedCoords(evt);
    region.setStart(x, y);
  }

  /** @param {MouseEvent} evt */
  function ClickVideoEnd(evt) {
    Log('ClickVideoEnd');
    toggles.ClickVideoEnd(false);
    toggles.ClickVideoMove(false);
    if (!data.isZoomed) {
      data.isZooming = false;
      const rect = region.getRect();
      if (rect.width > 15 && rect.height > 15) {
        ConsumeEvent(evt);
        data.didZoom = true;
        data.isZoomed = true;
        toggles.ResetZoom(true);
        ApplyZoomToRect(video, rect);
      }
      region.hide();
    }
  }

  /** @param {MouseEvent} evt */
  function ClickVideoMove(evt) {
    Log('ClickVideoMove');
    const { x, y } = getTranslatedCoords(evt);
    if (!data.isZoomed) {
      if (!data.isZooming) {
        toggles.ClickVideoEnd(false);
        toggles.ClickVideoMove(false);
        return;
      }
      region.drawRect(x, y);
    } else {
      region.setEnd(x, y);
      ApplyZoomToRect(video, rect);
    }
  }

  /** @param {MouseEvent} evt */
  function ResetZoom(evt) {
    if (!ClickedInside(video, evt)) {
      return;
    }
    Log('ResetZoom');
    toggles.ResetZoom(false);
    if (data.isZoomed) {
      evt.stopPropagation();
      evt.preventDefault();
      data.isZoomed = false;
      ResetVideoZoom(video);
      return false;
    }
    return true;
  }

  /** @param {MouseEvent} evt */
  function StopClickWhenZoomed(evt) {
    if (IsLeftClick(evt) && data.didZoom) {
      Log('StopClickWhenZoomed');
      data.didZoom = false;
      toggles.StopClickWhenZoomed(false);
      ConsumeEvent(evt);
    }
  }
}

/**
 * @param {HTMLVideoElement} video
 */
function VideoIsValid(video) {
  return video.isConnected && video.style.display !== 'none';
}

/**
 * @param {HTMLElement} el
 * @param {MouseEvent} evt
 */
function ClickedInside(el, evt) {
  const { left, top, width, height } = el.getBoundingClientRect();
  const { offsetLeft, offsetTop, offsetWidth, offsetHeight } = el;
  const { clientX, clientY } = evt;
  console.log(left, top, width, height);
  console.log(offsetLeft, offsetTop, offsetWidth, offsetHeight);
  return true;
  return (
    clientX >= left + offsetLeft && //
    clientX <= left + offsetLeft + offsetWidth &&
    clientY >= top + offsetTop &&
    clientY <= top + offsetTop + offsetHeight
  );
}

// const outline = document.createElement('div');
// outline.style.position = 'fixed';
// outline.style.top = '0';
// outline.style.width = '100px';
// outline.style.height = '100px';
// outline.style.outline = '2px solid red';
// outline.style.zIndex = '1000';
// outline.style.pointerEvents = 'none';
// document.body.append(outline);
// /**
//  * @param {HTMLElement} el
//  */
// function OutlineVideo(el) {
//   const { left, top } = el.getBoundingClientRect();
//   const { offsetLeft, offsetTop, offsetWidth, offsetHeight } = el;
//   outline.style.left = left + offsetLeft + 2 + 'px';
//   outline.style.top = top + offsetTop + 2 + 'px';
//   outline.style.width = offsetWidth - 4 + 'px';
//   outline.style.height = offsetHeight - 4 + 'px';
// }

Promise.all([PollForElement(VIDEO_QUERY, 250)]).then(([video]) => {
  if (video instanceof HTMLVideoElement) {
    Setup(video);
  }
});

//
// lib
//

/**
 * @param {Event} evt
 */
function ConsumeEvent(evt) {
  evt.stopPropagation();
  evt.preventDefault();
  evt.stopImmediatePropagation();
}

/**
 * @param {string} query
 * @param {number} ms
 * @return {Promise<HTMLElement>}
 */
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

/**
 * @param {()=>void} onEnable
 * @param {()=>void} onDisable
 * @returns {(enable:any=undefined)=>void}
 */
function Toggler(onEnable, onDisable) {
  let isEnabled = false;
  return (enable = undefined) => {
    if (isEnabled === enable) return;
    isEnabled = !isEnabled;
    isEnabled ? onEnable() : onDisable();
  };
}

/**
 * @param {MouseEvent} evt
 * @return {boolean}
 */
function IsLeftClick(evt) {
  return evt.button === 0;
}

/**
 * @param {MouseEvent} evt
 * @return {boolean}
 */
function IsMiddleClick(evt) {
  return evt.button === 1;
}

/**
 * @param {MouseEvent} evt
 * @return {boolean}
 */
function IsRightClick(evt) {
  return evt.button === 2;
}

/**
 * @param {*} args
 */
function Log(...args) {
  if (true) console.info('%cVideo Zoom:', 'color: red', ...args);
}
