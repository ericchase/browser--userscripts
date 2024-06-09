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
