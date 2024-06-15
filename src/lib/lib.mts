export function ConsumeEvent(e: Event) {
  e.stopPropagation();
  e.preventDefault();
  e.stopImmediatePropagation();
}

export function PollForElement(query: string, ms: number) {
  return new Promise<HTMLElement>((resolve) => {
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

export function Toggler(onEnable: () => void, onDisable: () => void) {
  let isEnabled = false;
  return (enable: any = undefined) => {
    if (isEnabled === enable) return;
    isEnabled = !isEnabled;
    isEnabled ? onEnable() : onDisable();
  };
}

export function IsLeftClick(e: MouseEvent) {
  return e.button === 0;
}
export function IsMiddleClick(e: MouseEvent) {
  return e.button === 1;
}
export function IsRightClick(e: MouseEvent) {
  return e.button === 2;
}

export function Log(...args: any[]) {
  if (false) console.log(...args);
}
