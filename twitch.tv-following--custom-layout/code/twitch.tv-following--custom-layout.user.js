// ==UserScript==
// @name            twitch.tv-following--custom-layout
// @namespace       https://github.com/ericchase
// @version         0.3
// @author          https://github.com/ericchase
// @description     A userscript to customize the layout of the user's twitch.tv/directory/following page.
// @source          https://github.com/ericchase/userscripts/tree/master/twitch.tv-following--custom-layout
// @icon
// @icon64
// @updateURL
// @supportURL      https://github.com/ericchase/userscripts/issues
// @include         https://www.twitch.tv/directory/*
// @match
// @exclude
// @require
// @resource
// @connect
// @run-at          document-end
// @grant           none
// @noframes
// @unwrap
// @nocompat
// ==/UserScript==


var target;
var config;

// The setInterval() function with a high frequency is used to hook a
// MutationObserver as quickly as possible to the necessary element. Once the
// observer is hooked, the timer is removed, and the observer handles any
// necessary updates from then on.
(function ()
{
    'use strict';
    var handle = setInterval(
        function ()
        {
            // The 'div' element with id 'directory-list' contains all the
            // stream preview objects for each tab of the 'following' page.
            target = document.querySelector("#directory-list");
            if (target !== null)
            {
                clearInterval(handle);
                // The 'subtree' option is necessary to observe the element
                // mentioned above. Without it, the observer will never
                // trigger.
                config = {
                    childList: true,
                    subtree: true
                };
                var observer = new MutationObserver(wait);
                observer.observe(target, config);
                wait(null, observer);
            }
        },
        50
    );
})();


var done = false;
var monitor =
    new MutationObserver(
        function (mutations, observer)
        {
            done = false;
        }
    );

function wait(mutations, observer)
{

    observer.disconnect();

    // monitored check
    done = false;
    monitor.observe(target, config);
    while (done === false)
    {
        done = true;
        check();
    }
    monitor.disconnect();

    observer.observe(target, config);

}


function check()
{

    var card = target.querySelectorAll(".js-streams .card__layout");
    if (card.length > 0)
    {
        update_cards(card);
    }

    var view = target.querySelectorAll(".js-streams .item.viewall");
    if (view.length > 0)
    {
        update_views(view);
    }

}


function update_cards(list)
{

    var query;
    var div;

    // Customizations
    // Affects: Stream objects under 'Live Channels' and 'Live Hosts'
    for (n = 0; n < list.length; ++n)
    {

        // Other: Skip objects that have already been modified
        query = list[n].querySelector(".card__quickname");
        if (query !== null)
        {
            continue;
        }


        // Modification: Remove VODCAST streams
        // Affects: All under 'Live Channels'
        // Inspired by Max Brown's script at
        // https://greasyfork.org/en/scripts/30444-twitch-vodcast-remover
        query = list[n].querySelector(".pill.is-watch-party");
        if (query !== null)
        {
            if (query.innerText == "Vodcast")
            {
                list[n].parentNode.parentNode.remove();
                continue;
            }
        }


        // Modification: Add large name above image preview
        // Affects: All
        div = document.createElement('div');
        div.classList = 'card__quickname';
        div.style.padding = '10px 0px';
        div.style.color = '#000000'; // font color = black
        div.style.fontSize = '200%';
        div.innerText = list[n].querySelector(".js-channel-link.ember-view").innerText;
        // place name on top
        list[n].insertBefore(div, list[n].childNodes[0]);


        // Modification: Remove mini-image preview
        // Affects: All
        query = list[n].querySelector(".card__boxpin");
        if (query !== null)
        {
            query.remove();
        }


        // Modification: Clicking image preview directly opens hosted stream
        // Affects: All under 'Live Hosts'
        query = list[n].querySelector(".card__info > a");
        if (query !== null)
        {
            var link = query.getAttribute("href");
            list[n].querySelector(".card__img > a").setAttribute("href", link.substring(0, link.length - 7));
        }

    }

}


function update_views(list)
{

    var query;
    var div;

    // Customizations
    // Affects: 'View All' objects under 'Live Channels' and 'Live Hosts'
    for (n = 0; n < list.length; ++n)
    {

        // Other: Skip objects that have already been modified
        query = list[n].querySelector(".view__quickname");
        if (query !== null)
        {
            continue;
        }


        // Modification: Add large text above image
        // Affects: All
        div = document.createElement('div');
        div.classList = 'view__quickname';
        div.style.padding = '10px 0px';
        div.style.color = '#808080'; // font color = gray
        div.style.fontSize = '200%';
        div.innerText = "(view all)";
        // place text on top
        list[n].insertBefore(div, list[n].childNodes[0]);

    }

}
