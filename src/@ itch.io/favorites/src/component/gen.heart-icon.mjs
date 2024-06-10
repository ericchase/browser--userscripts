import { $, cloneNode } from '../lib/lib.js';

/*#FILE ../assets/heart.css*/ const css = `#FILE`;
/*#FILE ../assets/heart.svg*/ const html = `#FILE`;

export const createHeartIcon = (function () {
  const htmlHeartIcon = (async function () {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(css);
    document.adoptedStyleSheets.push(sheet);
    return $('svg', 'svg', new DOMParser().parseFromString(html, 'text/html'));
  })();
  return async function () {
    const icon = cloneNode(await htmlHeartIcon, true);
    icon.classList.add('heart-icon');
    return icon;
  };
})();
