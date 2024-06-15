// ==UserScript==
// @name        itch.io: Favorites Button
// @author      ericchase, nazCodeland
// @namespace   ericchase
// @match       *://itch.io/*
// @version     0.0.1
// @description 5/5/2024, 7:21:16 PM
// @run-at      document-start
// @grant       none
// @homepageURL https://github.com/ericchase/userscript--itch.io-favorites
// ==/UserScript==

// userscript--itch.io-favorites
// Copyright © 2024 ericchase
// https://github.com/ericchase/userscript--itch.io-favorites
// https://www.apache.org/licenses/LICENSE-2.0

// Lucide License
// 
// ISC License
// 
// Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2022 as part
// of Feather (MIT). All other copyright (c) for Lucide are held by Lucide
// Contributors 2022.
// 
// Permission to use, copy, modify, and/or distribute this software for any
// purpose with or without fee is hereby granted, provided that the above
// copyright notice and this permission notice appear in all copies.
// 
// THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
// REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
// AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
// INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING
// FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT,
// NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE
// USE OR PERFORMANCE OF THIS SOFTWARE.

var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
const HTMLElementTagNameSet = /* @__PURE__ */ new Set(["a", "abbr", "address", "area", "article", "aside", "audio", "b", "base", "bdi", "bdo", "blockquote", "body", "br", "button", "canvas", "caption", "cite", "code", "col", "colgroup", "data", "datalist", "dd", "del", "details", "dfn", "dialog", "div", "dl", "dt", "em", "embed", "fieldset", "figcaption", "figure", "footer", "form", "h1", "h2", "h3", "h4", "h5", "h6", "head", "header", "hgroup", "hr", "html", "i", "iframe", "img", "input", "ins", "kbd", "label", "legend", "li", "link", "main", "map", "mark", "menu", "meta", "meter", "nav", "noscript", "object", "ol", "optgroup", "option", "output", "p", "picture", "pre", "progress", "q", "rp", "rt", "ruby", "s", "samp", "script", "search", "section", "select", "slot", "small", "source", "span", "strong", "style", "sub", "summary", "sup", "table", "tbody", "td", "template", "textarea", "tfoot", "th", "thead", "time", "title", "tr", "track", "u", "ul", "var", "video", "wbr"]);
const SVGElementTagNameSet = /* @__PURE__ */ new Set(["a", "animate", "animateMotion", "animateTransform", "circle", "clipPath", "defs", "desc", "ellipse", "feBlend", "feColorMatrix", "feComponentTransfer", "feComposite", "feConvolveMatrix", "feDiffuseLighting", "feDisplacementMap", "feDistantLight", "feDropShadow", "feFlood", "feFuncA", "feFuncB", "feFuncG", "feFuncR", "feGaussianBlur", "feImage", "feMerge", "feMergeNode", "feMorphology", "feOffset", "fePointLight", "feSpecularLighting", "feSpotLight", "feTile", "feTurbulence", "filter", "foreignObject", "g", "image", "line", "linearGradient", "marker", "mask", "metadata", "mpath", "path", "pattern", "polygon", "polyline", "radialGradient", "rect", "script", "set", "stop", "style", "svg", "switch", "symbol", "text", "textPath", "title", "tspan", "use", "view"]);
const MathMLElementTagNameSet = /* @__PURE__ */ new Set(["annotation", "annotation-xml", "maction", "math", "merror", "mfrac", "mi", "mmultiscripts", "mn", "mo", "mover", "mpadded", "mphantom", "mprescripts", "mroot", "mrow", "ms", "mspace", "msqrt", "mstyle", "msub", "msubsup", "msup", "mtable", "mtd", "mtext", "mtr", "munder", "munderover", "semantics"]);
function isHTMLElementTagName(tagName) {
  return HTMLElementTagNameSet.has(tagName);
}
function isSVGElementTagName(tagName) {
  return SVGElementTagNameSet.has(tagName);
}
function isMathMLElementTagName(tagName) {
  return MathMLElementTagNameSet.has(tagName);
}
const HTMLElementReferenceMap = /* @__PURE__ */ new Map();
function getHTMLElementReference(tagName) {
  const ref = HTMLElementReferenceMap.get(tagName) || document.createElement(tagName).constructor;
  if (!HTMLElementReferenceMap.has(tagName)) HTMLElementReferenceMap.set(tagName, ref);
  return ref;
}
const SVGElementReferenceMap = /* @__PURE__ */ new Map();
function getSVGElementReference(tagName) {
  const ref = SVGElementReferenceMap.get(tagName) || document.createElementNS("http://www.w3.org/2000/svg", tagName).constructor;
  if (!SVGElementReferenceMap.has(tagName)) SVGElementReferenceMap.set(tagName, ref);
  return ref;
}
const MathMLElementReferenceMap = /* @__PURE__ */ new Map();
function getMathMLElementReference(tagName) {
  const ref = MathMLElementReferenceMap.get(tagName) || document.createElementNS("http://www.w3.org/1998/Math/MathML", tagName).constructor;
  if (!MathMLElementReferenceMap.has(tagName)) MathMLElementReferenceMap.set(tagName, ref);
  return ref;
}
class QueryError extends Error {
  constructor(message, element) {
    super(message, { cause: element });
    this.element = element;
  }
}
function $(tagName, selector, root = document.documentElement) {
  const element = root.querySelector(selector);
  if (isHTMLElementTagName(tagName) && element instanceof getHTMLElementReference(tagName) || isSVGElementTagName(tagName) && element instanceof getSVGElementReference(tagName) || isMathMLElementTagName(tagName) && element instanceof getMathMLElementReference(tagName)) {
    return element;
  }
  throw new QueryError(`Query: \`${selector}\`. Element not of type: \`${tagName}\`.`, element);
}
function cloneNode(element, deep = false) {
  return element.cloneNode(deep);
}
const css = `.heart-icon {
  cursor: pointer;
  user-select: none;
  width: calc(16em / 14);
  height: calc(16em / 14);
  margin-inline-end: 0.125em;
  vertical-align: bottom;
  stroke: none;
  fill: lightgray;
  &:hover {
    fill: gray;
  }
  &.on {
    fill: red;
  }
}
`;
const html = `<!--
Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2022 as part 
of Feather (MIT). All other copyright (c) for Lucide are held by Lucide 
Contributors 2022.
-->
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="24"
  height="24"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
  class="lucide lucide-heart"
>
  <path
    d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
  />
</svg>
`;
const createHeartIcon = function() {
  const htmlHeartIcon = async function() {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(css);
    document.adoptedStyleSheets.push(sheet);
    return $("svg", "svg", new DOMParser().parseFromString(html, "text/html"));
  }();
  return async function() {
    const icon = cloneNode(await htmlHeartIcon, true);
    icon.classList.add("heart-icon");
    return icon;
  };
}();
class ElementAddedObserver {
  constructor({
    callback = () => void 0,
    //
    query = "",
    root = document.documentElement
  }) {
    __publicField(this, "mutationObserver");
    var _a;
    this.mutationObserver = new MutationObserver((mutationRecords) => {
      var _a2, _b;
      for (const record of mutationRecords) {
        for (const node of record.addedNodes) {
          if (node instanceof HTMLElement) {
            if (node.matches(query)) {
              if (((_a2 = callback(node)) == null ? void 0 : _a2.disconnect) === true) {
                return this.mutationObserver.disconnect();
              }
            }
            for (const element of node.querySelectorAll(query) ?? []) {
              if (element instanceof HTMLElement) {
                if (((_b = callback(element)) == null ? void 0 : _b.disconnect) === true) {
                  return this.mutationObserver.disconnect();
                }
              }
            }
          }
        }
      }
    });
    this.mutationObserver.observe(root, {
      subtree: true,
      childList: true
    });
    for (const element of root.querySelectorAll(query) ?? []) {
      if (element instanceof HTMLElement) {
        if (((_a = callback(element)) == null ? void 0 : _a.disconnect) === true) {
          this.mutationObserver.disconnect();
        }
      }
    }
  }
  disconnect() {
    this.mutationObserver.disconnect();
  }
}
class SetEx extends Set {
  constructor() {
    super();
  }
  addWithCB(value, callback) {
    if (this.has(value) === false) {
      this.add(value);
      callback == null ? void 0 : callback(value);
    }
  }
  deleteWithCB(value, callback) {
    if (this.has(value) === true) {
      this.delete(value);
      callback == null ? void 0 : callback(value);
    }
  }
}
class SetStore {
  constructor() {
    __publicField(this, "keySet", /* @__PURE__ */ new Set());
    __publicField(this, "subscriptionMap", /* @__PURE__ */ new Map());
  }
  subscribe(key, callback) {
    const subscriptionSet = this.subscriptionMap.get(key);
    if (subscriptionSet === void 0) {
      this.subscriptionMap.set(key, /* @__PURE__ */ new Set([callback]));
    } else {
      subscriptionSet.add(callback);
    }
    callback(this.keySet.has(key));
    return () => {
      const subscriptionSet2 = this.subscriptionMap.get(key);
      if (subscriptionSet2 !== void 0) {
        subscriptionSet2.delete(callback);
      }
    };
  }
  set(key, value) {
    if (value === true) {
      if (!this.keySet.has(key)) {
        this.keySet.add(key);
        const callbackSet = this.subscriptionMap.get(key);
        if (callbackSet !== void 0) {
          for (const callback of callbackSet) {
            callback(true);
          }
        }
      }
    } else {
      if (this.keySet.has(key)) {
        this.keySet.delete(key);
        const callbackSet = this.subscriptionMap.get(key);
        if (callbackSet !== void 0) {
          for (const callback of callbackSet) {
            callback(false);
          }
        }
      }
    }
  }
  update(key, callback) {
    this.set(key, callback(this.keySet.has(key)));
  }
  toggle(key) {
    this.update(key, (value) => {
      return !value;
    });
  }
}
class LocalStorageProvider {
  set(key, value) {
    window.localStorage.setItem(key.toString(), value.toString());
  }
  get(key) {
    return window.localStorage.getItem(key.toString());
  }
}
class GameCellObserver {
  constructor(favoritesStore = new SetStore()) {
    __publicField(this, "processedSet", new SetEx());
    this.favoritesStore = favoritesStore;
    new ElementAddedObserver({
      query: ".game_cell",
      callback: (element) => {
        this.processedSet.addWithCB(element, (value) => this.process(value));
      }
    });
  }
  async process(element) {
    const gameId = element.getAttribute("data-game_id");
    if (gameId !== null) {
      const elIcon = await createHeartIcon();
      this.favoritesStore.subscribe(gameId, (value) => {
        elIcon.classList.toggle("on", value);
      });
      elIcon.addEventListener("click", () => {
        this.favoritesStore.toggle(gameId);
      });
      $("a", ".title", element).before(elIcon);
    }
  }
}
new GameCellObserver(
  new class extends SetStore {
    constructor() {
      super();
      __publicField(this, "storageKey", "favorites");
      __publicField(this, "storageProvider", new LocalStorageProvider());
      for (const value of JSON.parse(this.storageProvider.get(this.storageKey) ?? "[]")) {
        this.keySet.add(value);
      }
    }
    set(key, value) {
      super.set(key, value);
      this.storageProvider.set(this.storageKey, JSON.stringify([...this.keySet]));
    }
  }()
);