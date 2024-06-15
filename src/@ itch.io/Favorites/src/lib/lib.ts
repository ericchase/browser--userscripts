// Copyright 2024 ericchase
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// prettier-ignore
const HTMLElementTagNameSet:Set<keyof HTMLElementTagNameMap>=new Set(['a','abbr','address','area','article','aside','audio','b','base','bdi','bdo','blockquote','body','br','button','canvas','caption','cite','code','col','colgroup','data','datalist','dd','del','details','dfn','dialog','div','dl','dt','em','embed','fieldset','figcaption','figure','footer','form','h1','h2','h3','h4','h5','h6','head','header','hgroup','hr','html','i','iframe','img','input','ins','kbd','label','legend','li','link','main','map','mark','menu','meta','meter','nav','noscript','object','ol','optgroup','option','output','p','picture','pre','progress','q','rp','rt','ruby','s','samp','script','search','section','select','slot','small','source','span','strong','style','sub','summary','sup','table','tbody','td','template','textarea','tfoot','th','thead','time','title','tr','track','u','ul','var','video','wbr']);
// prettier-ignore
const SVGElementTagNameSet:Set<keyof SVGElementTagNameMap>=new Set(['a','animate','animateMotion','animateTransform','circle','clipPath','defs','desc','ellipse','feBlend','feColorMatrix','feComponentTransfer','feComposite','feConvolveMatrix','feDiffuseLighting','feDisplacementMap','feDistantLight','feDropShadow','feFlood','feFuncA','feFuncB','feFuncG','feFuncR','feGaussianBlur','feImage','feMerge','feMergeNode','feMorphology','feOffset','fePointLight','feSpecularLighting','feSpotLight','feTile','feTurbulence','filter','foreignObject','g','image','line','linearGradient','marker','mask','metadata','mpath','path','pattern','polygon','polyline','radialGradient','rect','script','set','stop','style','svg','switch','symbol','text','textPath','title','tspan','use','view']);
// prettier-ignore
const MathMLElementTagNameSet:Set<keyof MathMLElementTagNameMap>=new Set(['annotation','annotation-xml','maction','math','merror','mfrac','mi','mmultiscripts','mn','mo','mover','mpadded','mphantom','mprescripts','mroot','mrow','ms','mspace','msqrt','mstyle','msub','msubsup','msup','mtable','mtd','mtext','mtr','munder','munderover','semantics']);

function isHTMLElementTagName(tagName: string): tagName is keyof HTMLElementTagNameMap {
  return HTMLElementTagNameSet.has(tagName as keyof HTMLElementTagNameMap);
}
function isSVGElementTagName(tagName: string): tagName is keyof SVGElementTagNameMap {
  return SVGElementTagNameSet.has(tagName as keyof SVGElementTagNameMap);
}
function isMathMLElementTagName(tagName: string): tagName is keyof MathMLElementTagNameMap {
  return MathMLElementTagNameSet.has(tagName as keyof MathMLElementTagNameMap);
}

const HTMLElementReferenceMap: Map<string, Function> = new Map();
function getHTMLElementReference(tagName: keyof HTMLElementTagNameMap) {
  const ref = HTMLElementReferenceMap.get(tagName) || document.createElement(tagName).constructor;
  if (!HTMLElementReferenceMap.has(tagName)) HTMLElementReferenceMap.set(tagName, ref);
  return ref;
}
const SVGElementReferenceMap: Map<string, Function> = new Map();
function getSVGElementReference(tagName: keyof SVGElementTagNameMap) {
  const ref = SVGElementReferenceMap.get(tagName) || document.createElementNS('http://www.w3.org/2000/svg', tagName).constructor;
  if (!SVGElementReferenceMap.has(tagName)) SVGElementReferenceMap.set(tagName, ref);
  return ref;
}
const MathMLElementReferenceMap: Map<string, Function> = new Map();
function getMathMLElementReference(tagName: keyof MathMLElementTagNameMap) {
  const ref = MathMLElementReferenceMap.get(tagName) || document.createElementNS('http://www.w3.org/1998/Math/MathML', tagName).constructor;
  if (!MathMLElementReferenceMap.has(tagName)) MathMLElementReferenceMap.set(tagName, ref);
  return ref;
}

type MatchFn = (selectors: string) => boolean;
type QuerySelectorAllFn<K = string, V extends Node = Element> = (selectors: K) => NodeListOf<V>;

export class QueryError extends Error {
  constructor(
    message: string,
    public element: Element,
  ) {
    super(message, { cause: element });
  }
}

/** Performs `querySelector` on `root` and typechecks the returned `HTMLElement` or `SVGElement` against `tagName`. Throws if no matching element. */
export function $<K extends keyof HTMLElementTagNameMap, V extends HTMLElementTagNameMap[K]>(
  tagName: K,
  selector: string,
  root?: { querySelector: Function },
): V;
export function $<K extends keyof SVGElementTagNameMap, V extends SVGElementTagNameMap[K]>(
  tagName: K,
  selector: string,
  root?: { querySelector: Function },
): V;
export function $<K extends keyof MathMLElementTagNameMap, V extends MathMLElementTagNameMap[K]>(
  tagName: K,
  selector: string,
  root?: { querySelector: Function },
): V;
export function $(
  tagName: keyof HTMLElementTagNameMap | keyof SVGElementTagNameMap | keyof MathMLElementTagNameMap, //
  selector: string,
  root: { querySelector: Function } = document.documentElement,
) {
  const element = root.querySelector(selector);
  if (
    (isHTMLElementTagName(tagName) && element instanceof getHTMLElementReference(tagName)) ||
    (isSVGElementTagName(tagName) && element instanceof getSVGElementReference(tagName)) ||
    (isMathMLElementTagName(tagName) && element instanceof getMathMLElementReference(tagName))
  ) {
    return element;
  }
  throw new QueryError(`Query: \`${selector}\`. Element not of type: \`${tagName}\`.`, element);
}

/** Performs `querySelectorAll` on `root` and typechecks the returned `HTMLElement`s or `SVGElement`s against `tagName`. Throws if any returned element doesn't match. */
export function $$<K extends keyof HTMLElementTagNameMap, V extends HTMLElementTagNameMap[K]>(
  tagName: K,
  selector: string,
  root?: { querySelectorAll: QuerySelectorAllFn<K, V> },
): V[];
export function $$<K extends keyof SVGElementTagNameMap, V extends SVGElementTagNameMap[K]>(
  tagName: K,
  selector: string,
  root?: { querySelectorAll: QuerySelectorAllFn<K, V> },
): V[];
export function $$<K extends keyof MathMLElementTagNameMap, V extends MathMLElementTagNameMap[K]>(
  tagName: K,
  selector: string,
  root?: { querySelectorAll: QuerySelectorAllFn<K, V> },
): V[];
export function $$(
  tagName: keyof HTMLElementTagNameMap | keyof SVGElementTagNameMap | keyof MathMLElementTagNameMap, //
  selector: string,
  root: { querySelectorAll: QuerySelectorAllFn<any, any> } = document.documentElement,
) {
  function innerFn<K>(tagName: K, getReference: (tagName: K) => Function) {
    const elements = [...root.querySelectorAll(selector)];
    for (const element of elements) {
      if (!(element instanceof getReference(tagName))) {
        throw new QueryError(`Query: \`${selector}\`. Element not of type: \`${tagName}\`.`, element);
      }
    }
    return elements;
  }
  if (isHTMLElementTagName(tagName)) {
    return innerFn(tagName, getHTMLElementReference);
  }
  if (isSVGElementTagName(tagName)) {
    return innerFn(tagName, getSVGElementReference);
  }
  if (isMathMLElementTagName(tagName)) {
    return innerFn(tagName, getMathMLElementReference);
  }
  throw `Invalid tag: \`${tagName}\``;
}

/** Calls `$$` with provided arguments. Includes `root` in the returned list if it matches `selector` and `tagName`. */
export function $$WithRoot<K extends keyof HTMLElementTagNameMap, V extends HTMLElementTagNameMap[K]>(
  tagName: K,
  selector: string,
  root?: { querySelectorAll: QuerySelectorAllFn<K, V> },
): V[];
export function $$WithRoot<K extends keyof SVGElementTagNameMap, V extends SVGElementTagNameMap[K]>(
  tagName: K,
  selector: string,
  root?: { querySelectorAll: QuerySelectorAllFn<K, V> },
): V[];
export function $$WithRoot<K extends keyof MathMLElementTagNameMap, V extends MathMLElementTagNameMap[K]>(
  tagName: K,
  selector: string,
  root?: { querySelectorAll: QuerySelectorAllFn<K, V> },
): V[];
export function $$WithRoot(
  tagName: keyof HTMLElementTagNameMap | keyof SVGElementTagNameMap | keyof MathMLElementTagNameMap, //
  selector: string,
  root: {
    querySelectorAll: QuerySelectorAllFn<any, any>;
  } = document.documentElement,
) {
  if (isHTMLElementTagName(tagName)) {
    const elements = $$(tagName, selector, root);
    if ('matches' in root && matches(tagName, selector, root as { matches: MatchFn })) {
      return [root as HTMLElementTagNameMap[keyof HTMLElementTagNameMap]].concat(elements);
    }
    return elements;
  }
  if (isSVGElementTagName(tagName)) {
    const elements = $$(tagName, selector, root);
    if ('matches' in root && matches(tagName, selector, root as { matches: MatchFn })) {
      elements.push(root as SVGElementTagNameMap[keyof SVGElementTagNameMap]);
    }
    return elements;
  }
  if (isMathMLElementTagName(tagName)) {
    const elements = $$(tagName, selector, root);
    if ('matches' in root && matches(tagName, selector, root as { matches: MatchFn })) {
      elements.push(root as MathMLElementTagNameMap[keyof MathMLElementTagNameMap]);
    }
    return elements;
  }
  throw `Invalid tag: \`${tagName}\``;
}

/** Calls `querySelectorAll` with provided arguments. Includes `root` in the returned list if it matches `selector`. */
export function querySelectorAllWithRoot<K extends keyof HTMLElementTagNameMap, V extends HTMLElementTagNameMap[K]>(
  selector: K,
  root: { matches?: MatchFn; querySelectorAll: QuerySelectorAllFn<K, V> },
): V[];
export function querySelectorAllWithRoot<K extends keyof SVGElementTagNameMap, V extends SVGElementTagNameMap[K]>(
  selector: K,
  root: { matches?: MatchFn; querySelectorAll: QuerySelectorAllFn<K, V> },
): V[];
export function querySelectorAllWithRoot<K extends keyof MathMLElementTagNameMap, V extends MathMLElementTagNameMap[K]>(
  selector: K,
  root: { matches?: MatchFn; querySelectorAll: QuerySelectorAllFn<K, V> },
): V[];
export function querySelectorAllWithRoot(
  selector: string, //
  root: { matches?: MatchFn; querySelectorAll: QuerySelectorAllFn },
): Element[];
export function querySelectorAllWithRoot(
  selector: string, //
  root: { matches?: MatchFn; querySelectorAll: QuerySelectorAllFn<any, any> },
) {
  const elements = [...root.querySelectorAll(selector)];
  if (root.matches?.(selector)) {
    elements.push(root);
  }
  return elements;
}

export function matches<K extends keyof HTMLElementTagNameMap, V extends HTMLElementTagNameMap[K]>(
  tagName: K,
  selector: string,
  element: { matches: MatchFn },
): element is V;
export function matches<K extends keyof SVGElementTagNameMap, V extends SVGElementTagNameMap[K]>(
  tagName: K,
  selector: string,
  element: { matches: MatchFn },
): element is V;
export function matches<K extends keyof MathMLElementTagNameMap, V extends MathMLElementTagNameMap[K]>(
  tagName: K,
  selector: string,
  element: { matches: MatchFn },
): element is V;
export function matches(
  tagName: keyof HTMLElementTagNameMap | keyof SVGElementTagNameMap | keyof MathMLElementTagNameMap, //
  selector: string,
  element: { matches: MatchFn },
) {
  return (
    (isHTMLElementTagName(tagName) && element instanceof getHTMLElementReference(tagName) && element.matches(selector)) ||
    (isSVGElementTagName(tagName) && element instanceof getSVGElementReference(tagName) && element.matches(selector)) ||
    (isMathMLElementTagName(tagName) && element instanceof getMathMLElementReference(tagName) && element.matches(selector))
  );
}

export function createElement<K extends keyof HTMLElementTagNameMap, V extends HTMLElementTagNameMap[K]>(tagName: K): V;
export function createElement<K extends keyof SVGElementTagNameMap, V extends SVGElementTagNameMap[K]>(tagName: K): V;
export function createElement<K extends keyof MathMLElementTagNameMap, V extends MathMLElementTagNameMap[K]>(tagName: K): V;
export function createElement(tagName: keyof HTMLElementTagNameMap | keyof SVGElementTagNameMap | keyof MathMLElementTagNameMap) {
  return document.createElement(tagName);
}

export function cloneNode<T extends { cloneNode: Function }>(element: T, deep = false) {
  return element.cloneNode(deep) as T;
}

export function discardError<T>(fn: () => T) {
  try {
    return fn();
  } catch (_) {}
  return undefined;
}

export function toRelativePx(px: number, root: Element = document.documentElement) {
  const fontSizePx = Number.parseInt(getComputedStyle(root).fontSize);
  return (fontSizePx / 16) * px;
}
