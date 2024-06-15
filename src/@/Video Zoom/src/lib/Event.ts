export function ConsumeEvent(e: Event) {
  e.preventDefault();
  e.stopImmediatePropagation();
  e.stopPropagation();
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
