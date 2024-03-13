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

  video.style.transform = `translate(-${newX}px, -${newY}px) scale(${scale})`;
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
    ClickBegin: Toggler(
      () => {
        window.addEventListener('mousedown', ClickBegin);
        window.addEventListener('mousedown', ClickBegin, true);
      },
      () => {
        window.removeEventListener('mousedown', ClickBegin);
        window.removeEventListener('mousedown', ClickBegin, true);
      }
    ),
    ClickEnd: Toggler(
      () => window.addEventListener('mouseup', ClickEnd, true),
      () => window.removeEventListener('mouseup', ClickEnd, true)
    ),
    ClickMove: Toggler(
      () => window.addEventListener('mousemove', ClickMove, true),
      () => window.removeEventListener('mousemove', ClickMove, true)
    ),
    ResetZoom: Toggler(
      () => window.addEventListener('contextmenu', ResetZoom, true),
      () => window.removeEventListener('contextmenu', ResetZoom, true)
    ),
    StopClickWhenZoomed: Toggler(
      () => window.addEventListener('click', StopClickWhenZoomed, true),
      () => window.removeEventListener('click', StopClickWhenZoomed, true)
    ),
  };

  toggles.ClickBegin(true);

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
  function ClickBegin(evt) {
    if (!VideoIsValid(video)) {
      CleanUp();
      return;
    }

    if (!IsLeftClick(evt) || !ClickedInside(video, evt)) {
      return;
    }

    Log('ClickBegin');

    if (evt.target === video) {
      ConsumeEvent(evt);
    }

    toggles.ClickEnd(true);
    toggles.ClickMove(true);

    data.isZooming = true;
    data.videoRect = video.getBoundingClientRect();

    const { x, y } = getTranslatedCoords(evt);
    region.setStart(x, y);
  }

  /** @param {MouseEvent} evt */
  function ClickEnd(evt) {
    Log('ClickEnd');

    toggles.ClickEnd(false);
    toggles.ClickMove(false);

    data.isZooming = false;

    {
      const rect = region.getRect();
      if (rect.width > 15 && rect.height > 15) {
        ConsumeEvent(evt);

        data.didZoom = true;
        data.isZoomed = true;

        toggles.ResetZoom(true);
        toggles.StopClickWhenZoomed(true);

        ApplyZoomToRect(video, rect);
      }
    }

    region.hide();
  }

  /** @param {MouseEvent} evt */
  function ClickMove(evt) {
    Log('ClickMove');

    if (!data.isZooming) {
      toggles.ClickEnd(false);
      toggles.ClickMove(false);
      return;
    }

    const { x, y } = getTranslatedCoords(evt);
    region.drawRect(x, y);
  }

  /** @param {MouseEvent} evt */
  function ResetZoom(evt) {
    Log('ResetZoom');

    toggles.ResetZoom(false);

    if (data.isZoomed) {
      evt.stopPropagation();
      evt.preventDefault();

      data.isZoomed = false;

      video.style.transform = '';

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
  const { left, top } = el.getBoundingClientRect();
  const { offsetLeft, offsetTop, offsetWidth, offsetHeight } = el;
  const { clientX, clientY } = evt;
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

function GetVideo() {
  Promise.all([
    PollForElement(VIDEO_QUERY, 250), //
  ]).then(([video]) => {
    if (video instanceof HTMLVideoElement) {
      Setup(video);
    }
  });
}
GetVideo();

//
// lib
//

/**
 * @param {*} args
 */
function Log(...args) {
  if (false) console.log(...args);
}

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
