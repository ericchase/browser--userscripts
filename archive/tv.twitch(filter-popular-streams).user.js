// ==UserScript==
// @name        Twitch: Filter Channels
// @description Remove high viewer count channels
// @namespace   ericchase
// @version     1.0.0
// @author      ericchase
// @match       https://www.twitch.tv/directory
// @match       https://www.twitch.tv/directory/*
// @grant       none
// @run-at      document-end
// ==/UserScript==

(function () {
    'use strict';

    // check for the presence of the filter button every second

    function startFilter(maxViewers) {
        const directory = document.querySelector('[data-target="directory-container"]');

        // Main Divs
        const newer = directory.firstChild;
        newer.style.display = 'none';
        const older = document.createElement('div');
        newer.classList.forEach((_) => older.classList.add(_));
        directory.prepend(older);

        // Extra Divs
        const flexBox = document.createElement('div');
        flexBox.style.display = 'flex';
        flexBox.style.flexDirection = 'row';
        flexBox.style.margin = '10px auto';
        document.body.append(flexBox);
        const loadCountDiv = document.createElement('div');
        flexBox.append(loadCountDiv);
        const filterCountDiv = document.createElement('div');
        filterCountDiv.style.marginLeft = '10px';
        flexBox.append(filterCountDiv);

        let loadCount = 0;
        let removeCount = 0;

        const wheelEvent = new Event('wheel');
        function filterStreams() {
            for (const box of newer.querySelectorAll('div[data-target]')) {
                ++loadCount;
                box.remove();
                const text = box.querySelector('.tw-media-card-stat').innerText.split(' ')[0];
                const count = (text.slice(-1) === 'K') ? Number.parseFloat(text.slice(0, -1)) * 1000 : Number.parseInt(text);
                if (count <= maxViewers) {
                    older.appendChild(box);
                } else {
                    ++removeCount;
                }
            }

            loadCountDiv.innerText = `${loadCount} loaded.`;
            filterCountDiv.innerText = `${removeCount} filtered.`;
            document.querySelectorAll('div.simplebar-scroll-content').forEach(_ => _.dispatchEvent(wheelEvent));
            setTimeout(_ => filterStreams(), 5000);
        }

        filterStreams();
    }

    let filterButton = undefined;
    const documentTimer = setInterval(() => {
        //const filterBar = document.querySelector('#directory-banner + div + div > div:first-child > div:first-child > div:first-child');
        const filterBar = document.querySelector('div[data-a-target="tags-filter-dropdown"]')?.parentNode?.nextSibling;

        if (filterBar && !Array.from(filterBar.childNodes).includes(filterButton)) {
            try {
                filterButton = document.createElement('button');
                filterButton.innerText = 'Filter Viewers >';
                filterButton.classList.add('ScCoreButton-sc-1qn4ixc-0', 'jGqsfG', 'ScCoreButton-sc-1d4t9uf-0', 'cxhEAF', 'tw-select-button');
                filterButton.style.margin = '0px 2px 0px 10px';
                filterButton.style.padding = '0 10px';

                const filterInput = document.createElement('input');
                filterInput.classList.add('gGjGiv', 'tw-input');
                filterInput.type = 'number';
                filterInput.style.border = '1px solid #e6e6e6';
                filterInput.style.borderRadius = '4px';
                filterInput.style.backgroundColor = '#eee';
                filterInput.style.padding = '0 2px';
                filterInput.style.width = '40px';
                filterInput.style.textAlign = 'center';
                filterInput.value = 30;

                filterBar.appendChild(filterButton);
                filterBar.appendChild(filterInput);

                filterButton.addEventListener('click', () => {
                    startFilter(Number.parseInt(filterInput.value));
                });

                const loadAllButton = document.createElement('button');
                loadAllButton.innerText = 'Load All';
                loadAllButton.classList.add('ScCoreButton-sc-1qn4ixc-0', 'jGqsfG', 'ScCoreButton-sc-1d4t9uf-0', 'cxhEAF', 'tw-select-button');
                loadAllButton.style.margin = '0px 2px 0px 10px';
                loadAllButton.style.padding = '0 10px';
            } finally {
                // clearInterval(documentTimer);
            }
        }
    }, 1000);
}());
