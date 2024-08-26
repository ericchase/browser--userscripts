export type PrettyIntersection<T> = {
  [K in keyof T]: T[K];
};
