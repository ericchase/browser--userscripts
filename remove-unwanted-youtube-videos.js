// ==UserScript==
// @name        Remove Unwanted Videos
// @namespace   Violentmonkey Scripts
// @match       https://www.youtube.com/
// @grant       none
// @version     1.0
// @author      ericchase
// @description 5/22/2022, 10:37:37 PM
// ==/UserScript==

const text_to_remove = [
    'china',
    'acoustic',
    'music',
    'years ago'
].map(text => text.toLowerCase());

function shouldBeRemoved(video) {
    const innerText = video.innerText.toLowerCase();
    for (const text of text_to_remove) {
        if (innerText.includes(text)) {
            return true;
        }
    }
    return false;
}

function hideVideo(video) {
    try {
        video.style.border = '1px solid red';
        video.querySelector('#content').style.display = 'none';
    } catch { }
}

function openMenu(video) {
    return new Promise((resolve, reject) => {
        const dots = video.querySelector('yt-icon-button yt-icon');
        if (!dots)
            reject();
        else {
            dots.click();
            resolve(dots);
        }
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

async function processVideo() {
    if (unprocessed_index < unprocessed_videos.length) {
        // console.log(`processing videos... ${unprocessed_videos.length - unprocessed_index} left`);
        const video = unprocessed_videos[unprocessed_index];

        if (shouldBeRemoved(video)) {

            // Just hide the video
            hideVideo(video);
            ++unprocessed_index;

            // Click the 'Not Interested' menu item
            // try {
            //     const dots = await openMenu(video);
            //     const menuItems = document.querySelectorAll('ytd-menu-popup-renderer ytd-menu-service-item-renderer');
            //     if (!clickMenuItem(menuItems, "Not interested"))
            //         dots.click(); // close menu
            //     ++unprocessed_index;
            // }
            // catch (e) { };

        } else {
            ++unprocessed_index;
        }
    }
    setTimeout(() => processVideo(), 100);
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
    setTimeout(() => processVideo(), 100);
}

new MutationObserver(function (_, observer) {
    const container = document.querySelector('#primary #contents');
    if (container) {
        observer.disconnect();
        watchForVideos(container);
    }
}).observe(document.body, { subtree: true, childList: true });
