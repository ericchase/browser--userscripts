import { $, cloneNode } from '../lib/lib.js';

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

export const createHeartIcon = (() => {
  const htmlHeartIcon = (async () => {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(css);
    document.adoptedStyleSheets.push(sheet);
    return $('svg', 'svg', new DOMParser().parseFromString(html, 'text/html'));
  })();
  return async () => {
    const icon = cloneNode(await htmlHeartIcon, true);
    icon.classList.add('heart-icon');
    return icon;
  };
})();
