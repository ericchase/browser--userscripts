type ElementAddedObserverConstructorParams = {
    callback?: (element: HTMLElement) => {
        disconnect: boolean;
    } | void;
    query?: string;
    root?: HTMLElement;
};
export declare class ElementAddedObserver {
    mutationObserver: MutationObserver;
    constructor({ callback, //
    query, root, }: ElementAddedObserverConstructorParams);
    disconnect(): void;
}
export {};
