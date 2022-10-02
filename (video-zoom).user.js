// ==UserScript==
// @name        *: Video Zoom
// @description 1/23/2022, 12:58:35 AM
// @namespace   ericchase
// @version     1.0.0
// @author      ericchase
// @match       *://*/*
// @grant       none
// @run-at      document-start
// ==/UserScript==

//const log = (...args) => console.log(...args);
const log = () => { };

class Region {
    constructor(sibling) {
        this.el = document.createElement('div');
        this.el.style.position = 'absolute';
        this.el.style.border = '2px solid red';
        this.el.style.pointerEvents = 'none';
        sibling.insertAdjacentElement('afterend', this.el);

        this.startPoint = { x: 0, y: 0 };
        this.endPoint = { x: 0, y: 0 };
        this.hide();
    }

    setStart(x, y) {
        this.startPoint.x = x;
        this.startPoint.y = y;
        this.endPoint.x = x;
        this.endPoint.y = y;
    }

    drawRect(x2, y2) {
        this.endPoint.x = x2;
        this.endPoint.y = y2;

        const rect = this.getRect();
        if (rect.width > 15 && rect.height > 15) {
            this.el.style.left = rect.x + 'px';
            this.el.style.top = rect.y + 'px';
            this.el.style.width = rect.width + 'px';
            this.el.style.height = rect.height + 'px';
            this.show();
        } else {
            this.el.style.left = 0;
            this.el.style.top = 0;
            this.el.style.width = 0;
            this.el.style.height = 0;
            this.hide();
        }
    }

    getRect() {
        let x1 = this.startPoint.x > this.endPoint.x ? this.endPoint.x : this.startPoint.x;
        let y1 = this.startPoint.y > this.endPoint.y ? this.endPoint.y : this.startPoint.y;
        let x2 = this.startPoint.x > this.endPoint.x ? this.startPoint.x : this.endPoint.x;
        let y2 = this.startPoint.y > this.endPoint.y ? this.startPoint.y : this.endPoint.y;
        return {
            x: x1 ?? 0,
            y: y1 ?? 0,
            width: x2 - x1 ?? 0,
            height: y2 - y1 ?? 0,
        };
    }

    show() {
        this.el.style.display = 'block';
    }

    hide() {
        this.el.style.display = 'none';
    }
}

function applyZoomToRect(video, rect) {
    const r = { x: rect.x, y: rect.y, w: rect.width, h: rect.height };
    const v = { x: video.offsetLeft, y: video.offsetTop, w: video.offsetWidth, h: video.offsetHeight };

    // get ratios of rectangle size to video size
    // choose the smaller scale
    const xScale = v.w / r.w;
    const yScale = v.h / r.h;
    const scale = xScale < yScale ? xScale : yScale;

    // calculate the new coordinates
    let newX = r.x * scale - (v.w - r.w * scale) / 2 - v.x * scale;
    let newY = r.y * scale - (v.h - r.h * scale) / 2 - v.y * scale;
    if (newX < 0) newX = 0;
    if (newY < 0) newY = 0;

    video.style.transform = `translate(-${newX}px, -${newY}px) scale(${scale})`;
}

function setupZoom(video) {
    'use strict';

    video.style.transformOrigin = `0 0 0`;

    const region = new Region(video);

    function exitZoom() {
        removeAllListeners();
        findVideoElement();
    }

    function removeAllListeners() {
        window.removeEventListener('click', stopClickWhenZoomed, true);
        window.removeEventListener('mousedown', clickBegin);
        window.removeEventListener('mousedown', clickBegin, true);
        window.removeEventListener('mousemove', clickMove, true);
        window.removeEventListener('contextmenu', resetZoom, true);
        window.removeEventListener('mouseup', clickEnd, true);
        window.removeEventListener('mouseup', stopMouseUp, true);
    }

    window.addEventListener('click', stopClickWhenZoomed, true);
    window.addEventListener('mousedown', clickBegin);
    window.addEventListener('mousedown', clickBegin, true);
    window.addEventListener('mouseup', stopMouseUp, true);

    let isZooming = false;
    let didZoom = false;
    let isZoomed = false;
    let videoRect = null;
    let stopNextMouseUp = false;

    function stopClickWhenZoomed(event) {
        if (didZoom) {
            didZoom = false;
            event.stopPropagation();
            event.preventDefault();
            event.stopImmediatePropagation();
        }
    }

    function clickBegin(event) {
        log('clickBegin');
        if (!video.isConnected) return exitZoom();
        if (video.style.display === 'none') return exitZoom();
        if (event.button !== 0) return;

        videoRect = video.getBoundingClientRect();
        const x = event.clientX - videoRect.left + video.offsetLeft;
        const y = event.clientY - videoRect.top + video.offsetTop;
        if (event.clientX < videoRect.left
            || event.clientX > videoRect.left + video.offsetWidth
            || event.clientY < videoRect.top
            || event.clientY > videoRect.top + video.offsetHeight) return;

        stopNextMouseUp = false;
        isZooming = true;

        if (event.target === video) {
            event.stopPropagation();
            event.preventDefault();
            event.stopImmediatePropagation();
        }

        window.addEventListener('mousemove', clickMove, true);
        window.addEventListener('mouseup', clickEnd, true);

        region.setStart(x, y);
    }

    function clickMove(event) {
        log('clickMove');
        if (!isZooming) {
            window.removeEventListener('mousemove', clickMove, true);
            window.removeEventListener('mouseup', clickEnd, true);
            return;
        }

        const x = event.clientX - videoRect.left + video.offsetLeft;
        const y = event.clientY - videoRect.top + video.offsetTop;
        region.drawRect(x, y);
    }

    function clickEnd(event) {
        log('clickEnd');
        window.removeEventListener('mousemove', clickMove, true);
        window.removeEventListener('mouseup', clickEnd, true);

        isZooming = false;

        const rect = region.getRect();
        if (rect.width > 15 && rect.height > 15) {
            stopNextMouseUp = true;
            event.stopPropagation();
            event.preventDefault();
            event.stopImmediatePropagation();
            window.addEventListener('contextmenu', resetZoom, true);
            applyZoomToRect(video, rect);
            didZoom = true;
            isZoomed = true;
        }
        region.hide();
    }

    function resetZoom(event) {
        log('resetZoom');
        window.removeEventListener('contextmenu', resetZoom, true);
        if (isZoomed) {
            stopNextMouseUp = true;
            event.stopPropagation();
            event.preventDefault();
            event.stopImmediatePropagation();
            video.style.transform = '';
            isZoomed = false;
            return false;
        }
        return true;
    }

    function stopMouseUp(event) {
        log('stopMouseUp');
        if (stopNextMouseUp) {
            stopNextMouseUp = false;
            event.stopPropagation();
            event.preventDefault();
            event.stopImmediatePropagation();
        }
    }
}

function findVideoElement() {
    let timer = setInterval(() => {
        const videoElements = document.querySelectorAll('video');
        for (let video of videoElements) {
            if (video.style.display !== 'none') {
                clearInterval(timer);
                return setupZoom(video);
            }
        }
    }, 100);
}

findVideoElement();
