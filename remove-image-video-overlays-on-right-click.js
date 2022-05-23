// ==UserScript==
// @name        Remove Image/Video Overlay on Right Click
// @namespace   Violentmonkey Scripts
// @match       https://www.instagram.com/p/*
// @grant       none
// @version     1.0
// @author      ericchase
// @description 1/28/2022, 6:07:39 AM
// ==/UserScript==

document.body.addEventListener('mousedown', function (e) {
    if (e.button === 2) {
        if (e.target.parentElement.querySelector(':scope>div>img')) {
            e.target.remove();
            return;
        }

        const videoElement = e.target.parentElement.querySelector(':scope>div>div>div>video');
        if (videoElement) {
            videoElement.setAttribute('controls', true);
            e.target.nextElementSibling.remove();
            e.target.previousElementSibling.remove();
            e.target.remove();
            return;
        }
    }
});
