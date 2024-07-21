export function CloneElement<T extends HTMLElement | SVGElement>(
  element: T,
  deep = false,
  error = (element: T) => {
    `Failed to clone element. ${element}`;
  },
) {
  const clone = element.cloneNode(deep);
  if (clone instanceof element.constructor) {
    return clone as typeof element;
  }
  throw error(element);
}
