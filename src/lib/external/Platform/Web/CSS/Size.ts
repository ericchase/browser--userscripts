export function ToRelativePx(px: number, root: HTMLElement | SVGElement = document.documentElement) {
  const fontSizePx = Number.parseInt(getComputedStyle(root).fontSize);
  return (fontSizePx / 16) * px;
}

// function ToRelativeEM() {} ??
