// ==UserScript==
// @name            google--fixed-search-tabs
// @namespace       https://github.com/ericchase
// @version         0.1
// @author          https://github.com/ericchase
// @description     Lets the user define a tab order for Google Search's tabbar.
// @source          https://github.com/ericchase/userscripts/edit/master/google--fixed-search-tabs
// @icon
// @icon64
// @updateURL
// @supportURL      https://github.com/ericchase/userscripts/issues
// @include         https://www.google.com/*
// @match
// @exclude
// @require
// @resource
// @connect
// @run-at          document-start
// @grant           none
// @noframes
// @unwrap
// @nocompat
// ==/UserScript==


// Above is the default heading for Tampermonkey userscripts that I personally use.
// It includes most of the important @tributes (attributes).


// User Constants
// "All" is first by default, but theoretically it doesn't have to be.
// You can choose as many or as little as you like, but 3~5 is a good number.
// ["All", "Images", "Videos", "News", "Maps", "Shopping", "Books", "Flights", "Finance", "Personal"]
let taborder = ["All", "Images", "Videos"];
// The tabs you do not include will appear under the 'More' tab.


// This is the default function provided by a new Tampermonkey userscript.
(function () {
    // The 'use strict' clause is a javascript option and changes the way certain things work.
    // I don't know the consequences of not using it, so I let it be.
    'use strict';

    // A consequence of 'use strict' is that variables are loaded differently.
    // As a workaround, I initialize any global variables that need to be preloaded first.
    //      Note that functions don't have this problem.
    preload();

    // The 'main' function is where the actual code goes.
    // Neither of these are necessary, but it makes for easy reading.
    main();
})();

// The bind function is a javascript method on certain prototypes (I don't know which).
// It's akin to partial function application in other languages.
// This is just a wrapper I found useful for this script. See application below.
function bind(object, functor)
{
    return object[functor].bind(object);
}

var Watch;

function preload()
{
    // This class was meant to encapsulate the MutationObserver concept.
    // It may or may not stick around.
    Watch = class
    {
        static childList({node, subtree, callback})
        {
            (new MutationObserver(callback)).observe(
                node, {childList: true, subtree: subtree}
            );
        }

        // Example call:

        // Watch.childList({
        //     node: document,
        //     subtree: false,
        //     callback: function(records, observer) {}
        // });
    };
}



function main()
{
    let tabbar_selector = "#hdtb-msb-vis";
    let morelist_selector = "#hdtb-msb > div:nth-child(1) > g-header-menu > div";

    waitfor(
        [tabbar_selector, morelist_selector],
        reorder_tabs
    );
}

function waitfor(selectors, callback)
{
    let item_list = [];
    function tryadd(item, timer)
    {
        if(item === null) return;
        clearInterval(timer);
        item_list.push(item);
        if(item_list.length == selectors.length)
            callback(item_list);
    }

    let timers = [];
    selectors.forEach(
        selector => {
            timers.push(setInterval(
                (selector, id) => tryadd(document.querySelector(selector), timers[id]),
                10, selector, timers.length));
        });
}



function reorder_tabs([tabbar, morelist])
{
    // Tab Structure
    //   active tabbar tab
    //   tabbar tab
    //   morelist tab
    // get tab structures
    // save active tab name
    // map name to href
    // delete tabs

    let tabs = Array.from(tabbar.childNodes);
    let moretabs = Array.from(morelist.childNodes);

    let active_structure = get_tab_structure_active(tabs);
    let inactive_structure = get_tab_structure_inactive(tabs);
    let extra_structure = get_tab_structure_extra(moretabs);

    let active_tabname = get_active_tab_name(tabs);
    let infomap = map_name_to_href(tabs.concat(moretabs));

    remove_all_tabs(tabbar);
    remove_all_tabs(morelist);

    // add desired tabs to tabbar
    //   clone tabbar tab structure for each

    Array.from(taborder).forEach(
        name => {
            let newtab;
            if(name === active_tabname)
                newtab = active_structure.cloneNode(true);
            else
                newtab = inactive_structure.cloneNode(true);
            settext(newtab, name);
            sethref(newtab, infomap.get(name));
            infomap.delete(name);
            tabbar.appendChild(newtab);
        });

    // add extra tabs to morelist
    //   clone morelist tab structure for each

    Array.from(infomap).forEach(
        entry => {
            let name = entry[0];
            let href = entry[1];
            let newtab;
            if(name === active_tabname)
                newtab = active_structure.cloneNode(true);
            else
                newtab = extra_structure.cloneNode(true);
            settext(newtab, name);
            sethref(newtab, href);
            if(name === active_tabname)
                tabbar.appendChild(newtab);
            else
                morelist.appendChild(newtab);
        });

    console.log("google--fixed-search-tabs: tabs reordered");
}

function strip_tab(tab)
{
    deltext(tab);
    delhref(tab);
    return tab;
}
function get_tab_structure_active(tabs)
{
    return strip_tab(tabs.find(
        tab => tab.classList.contains("hdtb-msel")
    ).cloneNode(true));
}
function get_tab_structure_inactive(tabs)
{
    return strip_tab(tabs.find(
        tab => tab.classList.contains("hdtb-msel") === false
    ).cloneNode(true));
}
function get_tab_structure_extra(tabs)
{
    return strip_tab(tabs[0].cloneNode(true));
}

function get_active_tab_name(tabs)
{
    return tabs.find(tab => tab.classList.contains("hdtb-msel")).innerText;
}
function map_name_to_href(tabs)
{
    let infomap = new Map([]);
    tabs.forEach(tab => infomap.set(gettext(tab), gethref(tab)));
    return infomap;
}
function remove_all_tabs(parent)
{
    Array.from(parent.childNodes).forEach(child => parent.removeChild(child));
}

function deltext(tab)
{
    if(tab.nodeName === "DIV" &&
       tab.classList.contains("hdtb-msel") === false)
        tab.childNodes[0].innerText = "";
    else
        tab.innerText = "";
}
function gettext(tab)
{
    if(tab.nodeName === "DIV" &&
       tab.classList.contains("hdtb-msel") === false)
        return tab.childNodes[0].innerText;
    else
        return tab.innerText;
}
function settext(tab, value)
{
    if(tab.nodeName === "DIV" &&
       tab.classList.contains("hdtb-msel") === false)
        tab.childNodes[0].innerText = value;
    else
        tab.innerText = value;
}

function delhref(tab)
{
    if(tab.nodeName === "DIV" &&
       tab.classList.contains("hdtb-msel") === false)
        tab.childNodes[0].setAttribute("href", "");
    else
        tab.setAttribute("href", "");
}
function gethref(tab)
{
    if(tab.nodeName === "DIV" &&
       tab.classList.contains("hdtb-msel") === false)
        return tab.childNodes[0].getAttribute("href");
    else
        return tab.getAttribute("href");
}
function sethref(tab, value)
{
    if(tab.nodeName === "DIV" &&
       tab.classList.contains("hdtb-msel") === false)
        tab.childNodes[0].setAttribute("href", value);
    else
        tab.setAttribute("href", value);
}
