export function ConsumeEvent(e) {
  e.stopPropagation();
  e.preventDefault();
  e.stopImmediatePropagation();
}
export function PollForElement(query, ms) {
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
export function Toggler(onEnable, onDisable) {
  let isEnabled = false;
  return (enable = undefined) => {
    if (isEnabled === enable) return;
    isEnabled = !isEnabled;
    isEnabled ? onEnable() : onDisable();
  };
}
export function IsLeftClick(e) {
  return e.button === 0;
}
export function IsMiddleClick(e) {
  return e.button === 1;
}
export function IsRightClick(e) {
  return e.button === 2;
}
export function Log(...args) {
  if (false) console.log(...args);
}
