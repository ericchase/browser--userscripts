export declare class SetEx<T> extends Set<T> {
    constructor();
    addWithCB(value: T, callback?: (value: T) => void): void;
    deleteWithCB(value: T, callback?: (value: T) => void): void;
}
