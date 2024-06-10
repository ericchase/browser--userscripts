/**
 * @param {()=>void} callback
 * @param {number} delay
 */
export function Debounce(callback, delay) {
  let timer = /**@type{NodeJS.Timeout | undefined}*/ (undefined);
  return function () {
    clearTimeout(timer);
    timer = setTimeout(() => {
      callback();
    }, delay);
  };
}

/** @param {string[]} strings */
export function MergeJSON(...strings) {
  /** @param {any[]} objects */
  function mergeObjects(...objects) {
    const to = /** @type {Record<any,any>} */ ({});
    for (const from of objects) {
      if (typeof from !== 'object') continue;
      for (const key in from) {
        if (from.hasOwnProperty(key)) {
          if (typeof from[key] === 'object' && Array.isArray(from[key]) === false) {
            to[key] = mergeObjects(to[key], from[key]);
          } else {
            to[key] = from[key];
          }
        }
      }
    }
    return to;
  }
  return mergeObjects(strings.map((s) => JSON.parse(s)));
}

/** @param {string} text */
export function ToSnakeCase(text) {
  return text.toLowerCase().replace(/ /g, '-');
}
