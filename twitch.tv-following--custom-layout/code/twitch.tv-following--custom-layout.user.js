// ==UserScript==
// @name            twitch.tv-following--custom-layout
// @namespace       https://github.com/ericchase
// @version         0.2
// @author          https://github.com/ericchase
// @description     A userscript to customize the layout of the user's twitch.tv/directory/following page.
// @source          https://github.com/ericchase/userscripts/tree/master/twitch.tv-following--custom-layout
// @icon
// @icon64
// @updateURL
// @downloadURL     https://greasyfork.org/en/scripts/32006-twitch-tv-following-custom-layout
// @supportURL      https://github.com/ericchase/userscripts/issues
// @include         https://www.twitch.tv/directory/following*
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
var observer;


// The setInterval() function with a high frequency is used to hook a
// MutationObserver as quickly as possible to the necessary element. Once the
// observer is hooked, the timer is removed, and the observer handles any
// necessary updates from then on.
(function () {
     'use strict';
     var handle = setInterval(
          function () {
               // The 'div' element with id 'directory-list' contains all the
               // stream preview objects for each tab of the 'following' page.
               target = document.getElementById("directory-list");
               if (target !== null) {
                    clearInterval(handle);
                    // The 'subtree' option is necessary to observe the element
                    // mentioned above. Without it, the observer will never
                    // trigger.
                    config = {
                         attributes: true,
                         childList: true,
                         characterData: true,
                         subtree: true
                    };
                    observer = new MutationObserver(update);
                    observer.observe(target, config);
                    update(null);
               }
          },
          50
     );
})();


function update(mutations) {

     observer.disconnect();

     var div;

     // Customizations
     // Affects: Stream objects under 'Live Channels' and 'Live Hosts'
     var card = document.querySelectorAll(".js-streams .card__layout");
     for (n = 0; n < card.length; ++n) {


          // Other: Skip objects that have already been modified
          if (card[n].querySelector(".card__quickname") !== null) {
               continue;
          }


          // Modification: Remove VODCAST streams
          // Affects: All under 'Live Channels'
          // Inspired by Max Brown's script at
          // https://greasyfork.org/en/scripts/30444-twitch-vodcast-remover
          if (card[n].querySelector(".pill.is-watch-party") !== null) {
               if (card[n].querySelector(".pill.is-watch-party").innerText == "Vodcast") {
                    card[n].parentNode.parentNode.remove();
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
          div.innerText = card[n].querySelector(".js-channel-link.ember-view").innerText;
          // place name on top
          card[n].insertBefore(div, card[n].childNodes[0]);


          // Modification: Remove mini-image preview
          // Affects: All
          card[n].querySelector(".card__boxpin").remove();


          // Modification: Clicking image preview directly opens hosted stream
          // Affects: All under 'Live Hosts'
          if (card[n].querySelector(".card__info > a") !== null) {
               var link = card[n].querySelector(".card__info > a").getAttribute("href");
               card[n].querySelector(".card__img > a").setAttribute("href", link.substring(0, link.length - 7));
          }


     }

     // Customizations
     // Affects: 'View All' objects under 'Live Channels' and 'Live Hosts'
     var view = document.querySelectorAll(".js-streams .item.viewall");
     for (n = 0; n < view.length; ++n) {


          // Other: Skip objects that have already been modified
          if (view[n].querySelector(".view__quickname") !== null) {
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
          view[n].insertBefore(div, view[n].childNodes[0]);


     }

     observer.observe(target, config);
}
