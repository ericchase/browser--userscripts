// ==UserScript==
// @name        twitch.tv: Scroll to Change Volume
// @author      ericchase
// @namespace   ericchase
// @match       *://www.twitch.tv/*
// @version     1.0.2
// @description 1/2/2023, 10:19:38 PM
// @run-at      document-start
// @grant       none
// @homepageURL https://github.com/ericchase/browser--userscripts
// ==/UserScript==

const settings = {
  volumeStepAmount: 0.05,
};

const uint8 = new Uint8Array([0]);

function handleMouseWheel(event, elVideo, elSlider, elSliderDisplay) {
  const min = 0;
  const max = 1 / settings.volumeStepAmount;
  uint8[0] = elVideo.volume / settings.volumeStepAmount;
  if (event.deltaY < 0) {
    uint8[0] = uint8[0] + 1 > max ? max : uint8[0] + 1;
  } else {
    uint8[0] = uint8[0] - 1 < min ? min : uint8[0] - 1;
  }
  const volume = uint8[0] * settings.volumeStepAmount;
  localStorage.setItem('volume', `${volume}`);
  elVideo.muted = volume === 0;
  updateVolume(volume, elVideo, elSlider, elSliderDisplay);
}

function handleMiddleClick(event, elVideo, elSlider, elSliderDisplay) {
  // mouse middle button click
  if (event.button === 1) {
    event.preventDefault();
    event.stopImmediatePropagation();
    event.stopPropagation();
    const storedVolume = Number.parseFloat(localStorage.getItem('volume'));
    if (storedVolume > 0) {
      elVideo.muted = !elVideo.muted;
      updateVolume(elVideo.muted ? 0 : storedVolume, elVideo, elSlider, elSliderDisplay);
    }
  }
}

function updateVolume(volume, elVideo, elSlider, elSliderDisplay) {
  elVideo.volume = volume;
  elSlider.value = elVideo.volume;
  elSlider.setAttribute('value', `${elVideo.volume}`);
  elSlider.setAttribute('aria-valuenow', `${elVideo.volume * 100}`);
  elSlider.setAttribute('aria-valuetext', `${elVideo.volume * 100}%`);
  elSliderDisplay.style.setProperty('width', `${elVideo.volume * 100}%`);
}

let setupComplete = false;
(function main() {
  setTimeout(function () {
    if (!setupComplete) console.log('Twitch: Scroll to Change Volume - Failed to Initialize');
  }, 10000);

  watchForDescendants({ selector: 'video' }, function callback(elVideo) {
    waitFor('.volume-slider__slider-container').then(function (elContainer) {
      elContainer.style.setProperty('opacity', '1.0', 'important');
    });

    Promise.allSettled([
      waitFor('[data-a-target="player-overlay-click-handler"]'),
      waitFor('[data-a-target="player-volume-slider"]'),
      waitFor('[data-test-selector="tw-range__fill-value-selector"]'),
    ]).then(function (outcomes) {
      const [elOverlay, elSlider, elSliderDisplay] = outcomes.map((_) => _.value);

      document.addEventListener('wheel', function onWheel(event) {
        if (event.target === elOverlay) {
          handleMouseWheel(event, elVideo, elSlider, elSliderDisplay);
        }
      });

      document.addEventListener('mousedown', function onMouseDown(event) {
        if (event.target === elOverlay) {
          handleMiddleClick(event, elVideo, elSlider, elSliderDisplay);
        }
      });

      elVideo.addEventListener('volumechange', function onVolumChange(event) {
        const volume = elVideo.muted ? 0 : Number.parseFloat(localStorage.getItem('volume'));
        if (elVideo.volume !== volume) {
          updateVolume(volume, elVideo, elSlider, elSliderDisplay);
        }
      });

      elSlider.setAttribute('step', `${settings.volumeStepAmount}`);

      setupComplete = true;
    });

    return false;
  });
})();

function waitFor(selector, root) {
  return new Promise((resolve) => {
    watchForDescendants({ selector, root }, function callback(el) {
      resolve(el);
      return false;
    });
  });
}

//
// Mutation Observer Functions
// 2023-01-03

/**
 * @param {object} param0
 * @param {string} param0.selector
 * @param {boolean} param0.subtree
 * @param {Node} param0.root
 * @param {(element: HTMLElement, record?: MutationRecord) => boolean} fn
 */
function watchForElement({ selector, subtree, root }, fn) {
  root ??= document;
  if (typeof selector !== 'string') return;
  const observer = new MutationObserver(function (records, observer) {
    for (const record of records) {
      if (record.addedNodes?.length === 0) continue;
      const elementList = record.target.querySelectorAll(selector);
      for (const element of elementList) {
        if (fn?.(element, record) === false) {
          return observer.disconnect();
        }
      }
    }
  });
  observer.observe(root, {
    childList: true,
    subtree,
  });
  const element = root.querySelector(selector);
  if (element) {
    if (fn?.(element) === false) {
      observer.disconnect();
    }
  }
  return observer;
}

/** Watches for immediate children only.
 * @param {object} param0
 * @param {string} param0.selector
 * @param {Node} param0.root
 * @param {(element: HTMLElement, record: MutationRecord) => boolean} fn
 */
function watchForChildren({ selector, root }, fn) {
  return watchForElement({ selector, subtree: false, root }, fn);
}

/** Watches for children and children's children.
 * @param {object} param0
 * @param {string} param0.selector
 * @par
 * am {Node} param0.root
 * @param {(element: HTMLElement, record: MutationRecord) => boolean} fn
 */
function watchForDescendants({ selector, root }, fn) {
  return watchForElement({ selector, subtree: true, root }, fn);
}
