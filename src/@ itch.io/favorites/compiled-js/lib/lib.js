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
const HTMLElementTagNameSet = new Set([
    'a',
    'abbr',
    'address',
    'area',
    'article',
    'aside',
    'audio',
    'b',
    'base',
    'bdi',
    'bdo',
    'blockquote',
    'body',
    'br',
    'button',
    'canvas',
    'caption',
    'cite',
    'code',
    'col',
    'colgroup',
    'data',
    'datalist',
    'dd',
    'del',
    'details',
    'dfn',
    'dialog',
    'div',
    'dl',
    'dt',
    'em',
    'embed',
    'fieldset',
    'figcaption',
    'figure',
    'footer',
    'form',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'head',
    'header',
    'hgroup',
    'hr',
    'html',
    'i',
    'iframe',
    'img',
    'input',
    'ins',
    'kbd',
    'label',
    'legend',
    'li',
    'link',
    'main',
    'map',
    'mark',
    'menu',
    'meta',
    'meter',
    'nav',
    'noscript',
    'object',
    'ol',
    'optgroup',
    'option',
    'output',
    'p',
    'picture',
    'pre',
    'progress',
    'q',
    'rp',
    'rt',
    'ruby',
    's',
    'samp',
    'script',
    'search',
    'section',
    'select',
    'slot',
    'small',
    'source',
    'span',
    'strong',
    'style',
    'sub',
    'summary',
    'sup',
    'table',
    'tbody',
    'td',
    'template',
    'textarea',
    'tfoot',
    'th',
    'thead',
    'time',
    'title',
    'tr',
    'track',
    'u',
    'ul',
    'var',
    'video',
    'wbr',
]);
const SVGElementTagNameSet = new Set([
    'a',
    'animate',
    'animateMotion',
    'animateTransform',
    'circle',
    'clipPath',
    'defs',
    'desc',
    'ellipse',
    'feBlend',
    'feColorMatrix',
    'feComponentTransfer',
    'feComposite',
    'feConvolveMatrix',
    'feDiffuseLighting',
    'feDisplacementMap',
    'feDistantLight',
    'feDropShadow',
    'feFlood',
    'feFuncA',
    'feFuncB',
    'feFuncG',
    'feFuncR',
    'feGaussianBlur',
    'feImage',
    'feMerge',
    'feMergeNode',
    'feMorphology',
    'feOffset',
    'fePointLight',
    'feSpecularLighting',
    'feSpotLight',
    'feTile',
    'feTurbulence',
    'filter',
    'foreignObject',
    'g',
    'image',
    'line',
    'linearGradient',
    'marker',
    'mask',
    'metadata',
    'mpath',
    'path',
    'pattern',
    'polygon',
    'polyline',
    'radialGradient',
    'rect',
    'script',
    'set',
    'stop',
    'style',
    'svg',
    'switch',
    'symbol',
    'text',
    'textPath',
    'title',
    'tspan',
    'use',
    'view',
]);
const MathMLElementTagNameSet = new Set([
    'annotation',
    'annotation-xml',
    'maction',
    'math',
    'merror',
    'mfrac',
    'mi',
    'mmultiscripts',
    'mn',
    'mo',
    'mover',
    'mpadded',
    'mphantom',
    'mprescripts',
    'mroot',
    'mrow',
    'ms',
    'mspace',
    'msqrt',
    'mstyle',
    'msub',
    'msubsup',
    'msup',
    'mtable',
    'mtd',
    'mtext',
    'mtr',
    'munder',
    'munderover',
    'semantics',
]);
function isHTMLElementTagName(tagName) {
    return HTMLElementTagNameSet.has(tagName);
}
function isSVGElementTagName(tagName) {
    return SVGElementTagNameSet.has(tagName);
}
function isMathMLElementTagName(tagName) {
    return MathMLElementTagNameSet.has(tagName);
}
const HTMLElementReferenceMap = new Map();
function getHTMLElementReference(tagName) {
    const ref = HTMLElementReferenceMap.get(tagName) || document.createElement(tagName).constructor;
    if (!HTMLElementReferenceMap.has(tagName))
        HTMLElementReferenceMap.set(tagName, ref);
    return ref;
}
const SVGElementReferenceMap = new Map();
function getSVGElementReference(tagName) {
    const ref = SVGElementReferenceMap.get(tagName) || document.createElementNS('http://www.w3.org/2000/svg', tagName).constructor;
    if (!SVGElementReferenceMap.has(tagName))
        SVGElementReferenceMap.set(tagName, ref);
    return ref;
}
const MathMLElementReferenceMap = new Map();
function getMathMLElementReference(tagName) {
    const ref = MathMLElementReferenceMap.get(tagName) || document.createElementNS('http://www.w3.org/1998/Math/MathML', tagName).constructor;
    if (!MathMLElementReferenceMap.has(tagName))
        MathMLElementReferenceMap.set(tagName, ref);
    return ref;
}
export class QueryError extends Error {
    element;
    constructor(message, element) {
        super(message, { cause: element });
        this.element = element;
    }
}
export function $(tagName, //
selector, root = document.documentElement) {
    const element = root.querySelector(selector);
    if ((isHTMLElementTagName(tagName) && element instanceof getHTMLElementReference(tagName)) ||
        (isSVGElementTagName(tagName) && element instanceof getSVGElementReference(tagName)) ||
        (isMathMLElementTagName(tagName) && element instanceof getMathMLElementReference(tagName))) {
        return element;
    }
    throw new QueryError(`Query: \`${selector}\`. Element not of type: \`${tagName}\`.`, element);
}
export function $$(tagName, //
selector, root = document.documentElement) {
    function innerFn(tagName, getReference) {
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
export function $$WithRoot(tagName, //
selector, root = document.documentElement) {
    if (isHTMLElementTagName(tagName)) {
        const elements = $$(tagName, selector, root);
        if ('matches' in root && matches(tagName, selector, root)) {
            return [root].concat(elements);
        }
        return elements;
    }
    if (isSVGElementTagName(tagName)) {
        const elements = $$(tagName, selector, root);
        if ('matches' in root && matches(tagName, selector, root)) {
            elements.push(root);
        }
        return elements;
    }
    if (isMathMLElementTagName(tagName)) {
        const elements = $$(tagName, selector, root);
        if ('matches' in root && matches(tagName, selector, root)) {
            elements.push(root);
        }
        return elements;
    }
    throw `Invalid tag: \`${tagName}\``;
}
export function querySelectorAllWithRoot(selector, //
root) {
    const elements = [...root.querySelectorAll(selector)];
    if (root.matches?.(selector)) {
        elements.push(root);
    }
    return elements;
}
export function matches(tagName, //
selector, element) {
    return ((isHTMLElementTagName(tagName) && element instanceof getHTMLElementReference(tagName) && element.matches(selector)) ||
        (isSVGElementTagName(tagName) && element instanceof getSVGElementReference(tagName) && element.matches(selector)) ||
        (isMathMLElementTagName(tagName) && element instanceof getMathMLElementReference(tagName) && element.matches(selector)));
}
export function createElement(tagName) {
    return document.createElement(tagName);
}
export function cloneNode(element, deep = false) {
    return element.cloneNode(deep);
}
export function discardError(fn) {
    try {
        return fn();
    }
    catch (_) { }
    return undefined;
}
export function toRelativePx(px, root = document.documentElement) {
    const fontSizePx = Number.parseInt(getComputedStyle(root).fontSize);
    return (fontSizePx / 16) * px;
}
