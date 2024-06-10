type MatchFn = (selectors: string) => boolean;
type QuerySelectorAllFn<K = string, V extends Node = Element> = (selectors: K) => NodeListOf<V>;
export declare class QueryError extends Error {
    element: Element;
    constructor(message: string, element: Element);
}
/** Performs `querySelector` on `root` and typechecks the returned `HTMLElement` or `SVGElement` against `tagName`. Throws if no matching element. */
export declare function $<K extends keyof HTMLElementTagNameMap, V extends HTMLElementTagNameMap[K]>(tagName: K, selector: string, root?: {
    querySelector: Function;
}): V;
export declare function $<K extends keyof SVGElementTagNameMap, V extends SVGElementTagNameMap[K]>(tagName: K, selector: string, root?: {
    querySelector: Function;
}): V;
export declare function $<K extends keyof MathMLElementTagNameMap, V extends MathMLElementTagNameMap[K]>(tagName: K, selector: string, root?: {
    querySelector: Function;
}): V;
/** Performs `querySelectorAll` on `root` and typechecks the returned `HTMLElement`s or `SVGElement`s against `tagName`. Throws if any returned element doesn't match. */
export declare function $$<K extends keyof HTMLElementTagNameMap, V extends HTMLElementTagNameMap[K]>(tagName: K, selector: string, root?: {
    querySelectorAll: QuerySelectorAllFn<K, V>;
}): V[];
export declare function $$<K extends keyof SVGElementTagNameMap, V extends SVGElementTagNameMap[K]>(tagName: K, selector: string, root?: {
    querySelectorAll: QuerySelectorAllFn<K, V>;
}): V[];
export declare function $$<K extends keyof MathMLElementTagNameMap, V extends MathMLElementTagNameMap[K]>(tagName: K, selector: string, root?: {
    querySelectorAll: QuerySelectorAllFn<K, V>;
}): V[];
/** Calls `$$` with provided arguments. Includes `root` in the returned list if it matches `selector` and `tagName`. */
export declare function $$WithRoot<K extends keyof HTMLElementTagNameMap, V extends HTMLElementTagNameMap[K]>(tagName: K, selector: string, root?: {
    querySelectorAll: QuerySelectorAllFn<K, V>;
}): V[];
export declare function $$WithRoot<K extends keyof SVGElementTagNameMap, V extends SVGElementTagNameMap[K]>(tagName: K, selector: string, root?: {
    querySelectorAll: QuerySelectorAllFn<K, V>;
}): V[];
export declare function $$WithRoot<K extends keyof MathMLElementTagNameMap, V extends MathMLElementTagNameMap[K]>(tagName: K, selector: string, root?: {
    querySelectorAll: QuerySelectorAllFn<K, V>;
}): V[];
/** Calls `querySelectorAll` with provided arguments. Includes `root` in the returned list if it matches `selector`. */
export declare function querySelectorAllWithRoot<K extends keyof HTMLElementTagNameMap, V extends HTMLElementTagNameMap[K]>(selector: K, root: {
    matches?: MatchFn;
    querySelectorAll: QuerySelectorAllFn<K, V>;
}): V[];
export declare function querySelectorAllWithRoot<K extends keyof SVGElementTagNameMap, V extends SVGElementTagNameMap[K]>(selector: K, root: {
    matches?: MatchFn;
    querySelectorAll: QuerySelectorAllFn<K, V>;
}): V[];
export declare function querySelectorAllWithRoot<K extends keyof MathMLElementTagNameMap, V extends MathMLElementTagNameMap[K]>(selector: K, root: {
    matches?: MatchFn;
    querySelectorAll: QuerySelectorAllFn<K, V>;
}): V[];
export declare function querySelectorAllWithRoot(selector: string, //
root: {
    matches?: MatchFn;
    querySelectorAll: QuerySelectorAllFn;
}): Element[];
export declare function matches<K extends keyof HTMLElementTagNameMap, V extends HTMLElementTagNameMap[K]>(tagName: K, selector: string, element: {
    matches: MatchFn;
}): element is V;
export declare function matches<K extends keyof SVGElementTagNameMap, V extends SVGElementTagNameMap[K]>(tagName: K, selector: string, element: {
    matches: MatchFn;
}): element is V;
export declare function matches<K extends keyof MathMLElementTagNameMap, V extends MathMLElementTagNameMap[K]>(tagName: K, selector: string, element: {
    matches: MatchFn;
}): element is V;
export declare function createElement<K extends keyof HTMLElementTagNameMap, V extends HTMLElementTagNameMap[K]>(tagName: K): V;
export declare function createElement<K extends keyof SVGElementTagNameMap, V extends SVGElementTagNameMap[K]>(tagName: K): V;
export declare function createElement<K extends keyof MathMLElementTagNameMap, V extends MathMLElementTagNameMap[K]>(tagName: K): V;
export declare function cloneNode<T extends {
    cloneNode: Function;
}>(element: T, deep?: boolean): T;
export declare function discardError<T>(fn: () => T): T | undefined;
export declare function toRelativePx(px: number, root?: Element): number;
export {};
