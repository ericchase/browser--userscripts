import { GetSemanticVersion } from './lib/lib-addon.mjs';
import { ReadFile, WriteFile } from './lib/lib-fs.mjs';
import { Run } from './lib/lib-process.mjs';

await Run('bun', ['run', 'format']);
await Run('bun', ['run', 'tsc']);
await Run('bun', ['run', 'vite', 'build']);

// await incrementVersionPatch();
const version = await GetSemanticVersion();
const script = await ReadFile('./dist/index.mjs');

const userscript = `
// ==UserScript==
// @name        itch.io: Favorites Button
// @author      ericchase, nazCodeland
// @namespace   ericchase
// @match       https://itch.io/*
// @version     ${version}
// @description 5/5/2024, 7:21:16 PM
// @run-at      document-start
// @grant       none
// @homepageURL https://github.com/ericchase/userscript--itch.io-favorites
// ==/UserScript==

// userscript--itch.io-favorites
// Copyright © 2024 ericchase
// https://www.apache.org/licenses/LICENSE-2.0

// Lucide License
// heart.svg
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

${script}
`.trim();

await WriteFile('./io.itch.Favorites Button.user.js', userscript);
