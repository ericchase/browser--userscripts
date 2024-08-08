// private members for module level mapping
const tagNameToElementReferenceMap: Map<string, Function> = new Map();
export function GetElementReference<K extends keyof HTMLElementTagNameMap | keyof SVGElementTagNameMap>(
  tagName: K, //
) {
  const ref = tagNameToElementReferenceMap.get(tagName) || document.createElement(tagName).constructor;
  if (!tagNameToElementReferenceMap.has(tagName)) {
    tagNameToElementReferenceMap.set(tagName, ref);
  }
  return ref;
}

/** Performs `querySelector` on `root` and typechecks the returned `HTMLElement` or `SVGElement` against `tagName`. Throws if no matching element. */
export function $<K extends keyof HTMLElementTagNameMap, V extends HTMLElementTagNameMap[K]>(tagName: K, selector: string, root?: { querySelector: Function }): V;
export function $<K extends keyof SVGElementTagNameMap, V extends SVGElementTagNameMap[K]>(tagName: K, selector: string, root?: { querySelector: Function }): V;
export function $<K extends keyof HTMLElementTagNameMap | keyof SVGElementTagNameMap, V extends (HTMLElementTagNameMap & SVGElementTagNameMap)[K]>(tagName: K, selector: string, root?: { querySelector: Function }): V;
export function $<K extends keyof HTMLElementTagNameMap | keyof SVGElementTagNameMap>(
  tagName: K, //
  selector: string,
  root: { querySelector: Function } = document.documentElement,
) {
  const element = root.querySelector(selector);
  if (element instanceof GetElementReference(tagName)) {
    return element;
  }
  throw `Query: \`${selector}\`. Element not of type: \`${tagName}\`. ${element}`;
}

/** Performs `querySelectorAll` on `root` and typechecks the returned `HTMLElement`s or `SVGElement`s against `tagName`. Throws if any returned element doesn't match. */
export function $$<K extends keyof HTMLElementTagNameMap, V extends HTMLElementTagNameMap[K]>(tagName: K, selector: string, root?: { querySelectorAll: Function }): V[];
export function $$<K extends keyof SVGElementTagNameMap, V extends SVGElementTagNameMap[K]>(tagName: K, selector: string, root?: { querySelectorAll: Function }): V[];
export function $$<K extends keyof HTMLElementTagNameMap | keyof SVGElementTagNameMap, V extends (HTMLElementTagNameMap & SVGElementTagNameMap)[K]>(tagName: K, selector: string, root?: { querySelectorAll: Function }): V[];
export function $$<K extends keyof HTMLElementTagNameMap | keyof SVGElementTagNameMap>(
  tagName: K, //
  selector: string,
  root: { querySelectorAll: Function } = document.documentElement,
) {
  const elements: (HTMLElementTagNameMap & SVGElementTagNameMap)[K][] = [...root.querySelectorAll(selector)];
  for (const element of elements) {
    if (!(element instanceof GetElementReference(tagName))) {
      throw `Query: \`${selector}\`. Element not of type: \`${tagName}\`. ${element}`;
    }
  }
  return elements;
}

/** Calls `$$` with provided arguments. Includes `root` in the returned list if it matches `selector` and `tagName`. */
export function $$$<K extends keyof HTMLElementTagNameMap, V extends HTMLElementTagNameMap[K]>(tagName: K, selector: string, root?: { querySelectorAll: Function }): V[];
export function $$$<K extends keyof SVGElementTagNameMap, V extends SVGElementTagNameMap[K]>(tagName: K, selector: string, root?: { querySelectorAll: Function }): V[];
export function $$$<K extends keyof HTMLElementTagNameMap | keyof SVGElementTagNameMap, V extends (HTMLElementTagNameMap & SVGElementTagNameMap)[K]>(tagName: K, selector: string, root?: { querySelectorAll: Function }): V[];
export function $$$<K extends keyof HTMLElementTagNameMap | keyof SVGElementTagNameMap>(
  tagName: K, //
  selector: string,
  root: { querySelectorAll: Function } = document.documentElement,
) {
  const elements: (HTMLElementTagNameMap & SVGElementTagNameMap)[K][] = $$(tagName, selector, root);
  if ('matches' in root && Matches(tagName, selector, root as { matches: Function })) {
    elements.push(root as (HTMLElementTagNameMap & SVGElementTagNameMap)[K]);
  }
  return elements;
}

export function QuerySelectorEx(
  selector: string, //
  root: { matches?: Function; querySelectorAll: Function } = document.documentElement,
): HTMLElement[] | SVGElement[] {
  const elements = [...root.querySelectorAll(selector)];
  if (root.matches?.(selector)) {
    elements.push(root);
  }
  return elements;
}

export function Matches<K extends keyof HTMLElementTagNameMap, V extends HTMLElementTagNameMap[K]>(tagName: K, selector: string, element: { matches: Function }): element is V;
export function Matches<K extends keyof SVGElementTagNameMap, V extends SVGElementTagNameMap[K]>(tagName: K, selector: string, element: { matches: Function }): element is V;
export function Matches<K extends keyof HTMLElementTagNameMap | keyof SVGElementTagNameMap, V extends (HTMLElementTagNameMap & SVGElementTagNameMap)[K]>(tagName: K, selector: string, element: { matches: Function }): element is V;
export function Matches<K extends keyof HTMLElementTagNameMap | keyof SVGElementTagNameMap>(
  tagName: K, //
  selector: string,
  element: { matches: Function },
) {
  return element instanceof GetElementReference(tagName) && element.matches(selector);
}
