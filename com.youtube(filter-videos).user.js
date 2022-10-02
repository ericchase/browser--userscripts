// ==UserScript==
// @name        YouTube: Remove Unwanted Videos
// @namespace   ericchase
// @match       *://www.youtube.com/
// @version     1.0.1
// @description 5/22/2022, 10:37:37 PM
// @run-at      document-start
// @grant       none
// @homepageURL https://github.com/ericchase/browser--userscripts
// ==/UserScript==

const config = {
    maxAge: parseAge('1 year'),
    // minRuntime: toSeconds('9:00'),
    // maxRuntime: toSeconds('2:30:00'),

    dismissIfLive: true,
    dismissIfRemix: true,
    dismissIfWatched: true,
};

const text_to_remove = [
    'Acoustic',
    'Beats',
    'China',
    'Covers',
    'Crypto',
    'Hits',
    'K.A.R.D',
    'KARD',
    'Minecraft',
    'Mix',
    'Music',
    'Prank',
    'Songs',
    'TikTok',
    'years ago'
].map(text => text.toLowerCase());

function shouldBeRemoved(video) {
    const selectors = {
        isRemix: 'yt-icon.ytd-thumbnail-overlay-bottom-panel-renderer',
        isLive: '.badge-style-type-live-now, .badge-style-type-live-now-alternate',
        videoProgress: 'ytd-thumbnail-overlay-resume-playback-renderer',
    };

    const videoAge = parseVideoAge(video);
    if (videoAge > config.maxAge) return true;

    // const videoRuntime = parseVideoRuntime(video);
    // if (videoRuntime < config.minRuntime) return true;
    // if (videoRuntime > config.maxRuntime) return true;

    if (config.dismissIfLive && video.querySelector(selectors.isLive)) return true;
    if (config.dismissIfRemix && video.querySelector(selectors.isRemix)) return true;
    if (config.dismissIfWatched && video.querySelector(selectors.videoProgress)) return true;

    const innerText = video.innerText.toLowerCase();
    for (const text of text_to_remove) {
        if (innerText.includes(text)) {
            return true;
        }
    }

    return false;
}

function parseVideoAge(video) {
    try {
        const el = video.querySelector('[id="metadata-line"] span:nth-child(2)');
        return parseAge(el.innerHTML);
    } catch {
        return 0;
    }
}

function parseAge(ageString) {
    if (!ageString) return 0;

    ageString = ageString.split(' ', 2);

    const unit = ageString[1];
    const count = parseInt(ageString[0]);

    if (unit.includes('day')) return count;
    if (unit.includes('week')) return count * 7;
    if (unit.includes('year')) return count * 365;
    if (unit.includes('month')) return count * 30;

    return 0;
}

function parseVideoRuntime(video) {
    try {
        const el = video.querySelector('ytd-thumbnail-overlay-time-status-renderer span');
        return toSeconds(el.innerHTML);
    } catch {
        return config.minRuntime;
    }
}

function toSeconds(timeString) {
    if (!timeString) return;

    timeString = timeString.split(':');
    const timePieces = timeString.length;

    if (timePieces < 2 || timePieces > 3) return;
    if (timePieces === 2) return parseInt(timeString[0] * 60) + parseInt(timeString[1]);

    return parseInt(timeString[0] * 3600) + parseInt(timeString[1] * 60) + parseInt(timeString[2]);
}

function hideVideo(video) {
    try {
        video.style.border = '1px solid red';
        video.querySelector('#content').style.display = 'none';
    } catch { }
}

function getMenu(video) {
    return new Promise((resolve, reject) => {
        const dots = video.querySelector('yt-icon-button yt-icon');
        if (!dots) resolve(null); else resolve(dots);
    });
}

function clickMenuItem(menuItems, itemName) {
    for (const item of menuItems) {
        if (item.querySelector('yt-formatted-string').innerText === itemName) {
            item.click();
            return true;
        }
    }
    return false;
}

const found_videos = new Set();
const unprocessed_videos = [];
let unprocessed_index = 0;

function isVisible(el) {
    return window.getComputedStyle(el).display !== 'none';
}

async function checkForMenu() {
    if (unprocessed_index < unprocessed_videos.length) {
        const video = unprocessed_videos[unprocessed_index];
        if (video && isVisible(video)) {
            const dots = await getMenu(video);
            if (dots) {
                unprocessed_index = 0;
                setTimeout(() => processVideos(), 50);
                return;
            }
        }
        ++unprocessed_index;
    } else {
        unprocessed_index = 0;
    }
    setTimeout(() => checkForMenu(), 50);
}

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

async function processVideos() {
    if (unprocessed_index < unprocessed_videos.length) {
        const video = unprocessed_videos[unprocessed_index];

        if (video && isVisible(video) && shouldBeRemoved(video)) {

            // hideVideo(video);
            const dots = await getMenu(video);
            if (dots) {
                const scrollY = window.scrollY;
                dots.click();
                await sleep(10);
                const menuItems = document.querySelectorAll('ytd-menu-popup-renderer ytd-menu-service-item-renderer');
                if (!clickMenuItem(menuItems, "Not interested")) {
                    dots.click(); // close menu
                }
                await sleep(10);
                window.scrollTo(0, scrollY);
            }
        }

        ++unprocessed_index;
    }
    setTimeout(() => processVideos(), 50);
}

function watchForVideos(container) {
    new MutationObserver(function (_, observer) {
        const videos = document.querySelectorAll('ytd-rich-item-renderer');

        for (const video of videos) {
            if (!found_videos.has(video)) {
                found_videos.add(video);
                unprocessed_videos.push(video);
            }
        }
    }).observe(container, { subtree: true, childList: true });
    setTimeout(() => checkForMenu(), 50);
}

new MutationObserver(function (_, observer) {
    const container = document.querySelector('#primary #contents');
    if (container) {
        observer.disconnect();
        watchForVideos(container);
    }
}).observe(document.body, { subtree: true, childList: true });
