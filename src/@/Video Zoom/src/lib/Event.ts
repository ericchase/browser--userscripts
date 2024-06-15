export function ConsumeEvent(e: Event) {
  e.stopPropagation();
  e.preventDefault();
  e.stopImmediatePropagation();
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
