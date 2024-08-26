const header = `
// ==UserScript==
// @name        com.vgmtreasurechest: Download Song
// @author      ericchase
// @namespace   ericchase
// @match       *://vgmtreasurechest.com/soundtracks/*
// @version     1.0.0
// @description 2024/08/09, 5:46:10 PM
// @run-at      document-start
// @grant       none
// @homepageURL https://github.com/ericchase/browser--userscripts
// ==/UserScript==
`;

import { SaveUrl } from './lib/ericchase/Platform/Web/AnchorDownloader.js';
SaveUrl(location.href, new URL(location.href).pathname.split('/').at(-1) ?? '');
