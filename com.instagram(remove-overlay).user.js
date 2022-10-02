// ==UserScript==
// @name        Instagram: Remove Image/Video Overlay on Right Click
// @namespace   ericchase
// @match       https://www.instagram.com/*
// @version     1.0.0
// @description 1/28/2022, 6:07:39 AM
// @run-at      document-start
// @grant       none
// @homepageURL https://github.com/ericchase/browser--userscripts
// ==/UserScript==

function grabImageElement(el) {
    const elImage = el.querySelector(':scope>div>img');
    return { elImage };
}

function grabVideoElement(el) {
    // The modal video is displayed in the sort of focused component that is
    // overlayed on top of the page. The page in the background is then
    // slightly obscurred with a transparent black mask.
    const elModalVideo = el.parentElement.querySelector(':scope>div>div>div>video');
    const elVideo = el.parentElement.parentElement.parentElement.querySelector(':scope>video');
    return { elModalVideo, elVideo };
}

function removeChildren(elParent, elIgnore) {
    const elRemovalList = [];
    for (const elChild of elParent.children)
        if (elChild !== elIgnore && !elChild.contains(elIgnore))
            elRemovalList.push(elChild);
    for (const el of elRemovalList)
        el.remove();
}

function removeOveralElement(mouseEvent, elTarget, elParent) {
    if (mouseEvent.button === 2) {
        const { elImage } = grabImageElement(elParent);
        if (elImage) {
            elTarget.remove();
            return true;
        }
        const { elModalVideo, elVideo } = grabVideoElement(elTarget);
        if (elModalVideo) {
            elModalVideo.setAttribute('controls', true);
            removeChildren(elParent, elModalVideo);
            return true;
        } else if (elVideo) {
            elVideo.setAttribute('controls', true);
            elParent.remove();
            return true;
        }
        console.log('No overlay found?');
        return false;
    }
}

function preventContextMenuPopupOnce(e) {
    window.removeEventListener('contextmenu', preventContextMenuPopupOnce);
    e.preventDefault();
}

document.body.addEventListener('mousedown', function (e) {
    if (removeOveralElement(e, e.target, e.target.parentElement)) {
        window.addEventListener('contextmenu', preventContextMenuPopupOnce);
        e.preventDefault();
        e.stopImmediatePropagation();
        e.stopPropagation();
    }
});
