// ==UserScript==
// @name        *: Volume/Scroll
// @namespace   ericchase
// @match       *://*/*
// @version     1.0.0
// @description 11/4/2023, 11:40:41 PM
// @run-at      document-start
// @grant       none
// @homepageURL https://github.com/ericchase/browser--userscripts
// ==/UserScript==

const VOLUME_STEP = 0.05;
const VIDEO_QUERY = 'video';

/**
 * @param {HTMLVideoElement} video
 * @param {boolean} increase
 */
function ChangeVolume(video, increase) {
  Log('ChangeVolume');

  if (video.muted) {
    video.volume = 0;
  }
  const amount = increase ? VOLUME_STEP : -VOLUME_STEP;
  video.volume = Math.min(Math.max(video.volume + amount, 0), 1);
  if (video.volume > 0) {
    video.muted = false;
    video.defaultMuted = false;
  }
}

/**
 * @param {HTMLVideoElement} video
 */
function ToggleMute(video) {
  Log('ToggleMute');

  if (video.volume === 0) {
    video.muted = false;
    video.defaultMuted = false;
    ChangeVolume(video, true);
  } else {
    video.muted = !video.muted;
    video.defaultMuted = video.muted;
  }
}

//
// setup extension
//

/**
 * @param {object} args
 * @param {HTMLVideoElement} args.video
 * @param {HTMLElement} args.target
 */
function VolumeHandler({ video, target }) {
  Log('VolumeHandler');

  /** @param {WheelEvent} evt */
  function listener(evt) {
    Log('wheel listener');

    ConsumeEvent(evt);
    ChangeVolume(video, evt.deltaY < 0);
  }
  return Toggler(
    () => target.addEventListener('wheel', listener),
    () => target.removeEventListener('wheel', listener)
  );
}

/**
 * @param {object} args
 * @param {HTMLVideoElement} args.video
 * @param {HTMLElement} args.target
 */
function MuteHandler({ video, target }) {
  Log('MuteHandler');

  /** @param {MouseEvent} evt */
  function listener(evt) {
    if (IsMiddleClick(evt)) {
      Log('middle click listener');

      ConsumeEvent(evt);
      ToggleMute(video);
    }
  }
  return Toggler(
    () => target.addEventListener('mousedown', listener),
    () => target.removeEventListener('mousedown', listener)
  );
}

function MoveHandler() {
  let previousY = 0;
  let scrolling = false;

  /** @param {MouseEvent} evt */
  function contextListener(evt) {
    evt.preventDefault();
    contextHandler(false);
  }
  const contextHandler = Toggler(
    () => {
      document.addEventListener('contextmenu', contextListener);
      document.addEventListener('contextmenu', contextListener, true);
    },
    () => {
      document.removeEventListener('contextmenu', contextListener);
      document.removeEventListener('contextmenu', contextListener, true);
    }
  );

  /** @param {MouseEvent} evt */
  function scrollListener(evt) {
    // Log('scrollListener');
    const delta = previousY - evt.screenY;
    if (!scrolling && (delta < -15 || delta > 15)) {
      scrolling = true;
    }
    if (scrolling) {
      // Log('scrolling');
      contextHandler(true);
      releaseHandler(true);
      window.scrollBy(0, delta);
      previousY = evt.screenY;
    }
  }
  const scrollHandler = Toggler(
    () => document.addEventListener('mousemove', scrollListener),
    () => document.removeEventListener('mousemove', scrollListener)
  );

  /** @param {MouseEvent} evt */
  function releaseListener(evt) {
    if (IsRightClick(evt)) {
      Log('releaseListener');
      scrollHandler(false);
      releaseHandler(false);
      previousY = 0;
      scrolling = false;
    }
  }
  const releaseHandler = Toggler(
    () => {
      Log('releaseHandler on');
      document.addEventListener('mouseup', releaseListener);
      document.addEventListener('mouseup', releaseListener, true);
    },
    () => {
      Log('releaseHandler off');
      document.removeEventListener('mouseup', releaseListener);
      document.removeEventListener('mouseup', releaseListener, true);
    }
  );

  /** @param {MouseEvent} evt */
  function listener(evt) {
    if (IsRightClick(evt)) {
      Log('move listener');
      releaseHandler(true);
      scrollHandler(true);
      previousY = evt.screenY;
    }
  }
  return Toggler(
    () => {
      Log('move handler on');
      window.addEventListener('mousedown', listener);
    },
    () => {
      Log('move handler off');
      window.removeEventListener('mousedown', listener);
    }
  );
}

/**
 * @param {HTMLVideoElement} video
 */
function SetupVolumeControls(video) {
  MuteHandler({ video, target: video })(true);
  VolumeHandler({ video, target: video })(true);
  // MuteHandler({ video, target: controls })(true);
  // VolumeHandler({ video, target: controls })(true);
  {
    const toggleMove = MoveHandler();
    toggleMove(true);
    // const toggle = VolumeHandler({ video, target: video });
    document.addEventListener('fullscreenchange', function () {
      // toggle(document.fullscreenElement);
      if (document.fullscreenElement) {
        toggleMove(false);
      } else {
        toggleMove(true);
        video.scrollIntoView(true);
      }
    });
  }
}

Promise.all([PollForElement(VIDEO_QUERY, 250)]).then(([video]) => {
  if (video instanceof HTMLVideoElement) {
    Log('video found');

    SetupVolumeControls(video);
    function scrollToVideo() {
      if (video.getBoundingClientRect().y !== 0) {
        video.scrollIntoView(true);
      }
    }
    function unsubscribeAll() {
      document.removeEventListener('scroll', scrollToVideo);
      document.removeEventListener('wheel', unsubscribeAll);
      document.removeEventListener('keydown', unsubscribeAll);
      document.removeEventListener('mousedown', unsubscribeAll);
    }
    document.addEventListener('scroll', scrollToVideo);
    document.addEventListener('wheel', unsubscribeAll);
    document.addEventListener('keydown', unsubscribeAll);
    document.addEventListener('mousedown', unsubscribeAll);
    scrollToVideo();
  }
});

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
