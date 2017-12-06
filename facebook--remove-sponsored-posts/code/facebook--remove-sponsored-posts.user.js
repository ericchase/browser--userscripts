// ==UserScript==
// @name            facebook.com--remove-sponsored-posts
// @namespace       https://github.com/ericchase
// @version         0.1
// @author          https://github.com/ericchase
// @description     Tries to remove posts that have the "Sponsored" tag.
// @source          https://github.com/ericchase/userscripts/tree/master/facebook.com--remove-sponsored-posts
// @icon
// @icon64
// @updateURL
// @supportURL      https://github.com/ericchase/userscripts/issues
// @include         https://www.facebook.com/*
// @match
// @exclude
// @require
// @resource
// @connect
// @run-at          document-body
// @grant           none
// @noframes
// @unwrap
// @nocompat
// ==/UserScript==



(function () {
    'use strict';
    preload();
    main();
})();

function bind(object, functor)
{
    return object[functor].bind(object);
}

// strict mode changes the way variables are loaded
// this is a little workaround for now
// note that functions don't have this problem
var Stream;
var Watch;

function preload()
{
    Stream = class
    {
        constructor()
        {
            this.elements = [];
        }

        static of(array)
        {
            let newStream = new Stream();
            for (let n = 0; n < array.length; ++n)
                newStream.elements.push(array[n]);
            return newStream;
        }

        filter(predicate)
        {
            let list = this.elements;
            let filteredStream = new Stream();
            for(let n in list)
                if(predicate(list[n]))
                    filteredStream.elements.push(list[n]);
            return filteredStream;
        }

        map(functor)
        {
            let list = this.elements;
            for(let n in list)
                functor(list[n]);
        }

        anyMatch(predicate)
        {
            let list = this.elements;
            for(let n in list)
                if(predicate(list[n]))
                    return true;
            return false;
        }
    };
    
    Watch = class
    {
        static childList(node, callback)
        {
            let handler = function(records, observer) {
                Stream.of(records).map(
                    (record) => {
                        callback(record.target, observer);
                    }
                );
            };

            (new MutationObserver(handler)).observe( node, {
                childList: true,
                subtree: true
            });
        }
    };
}

function main()
{
    waitfor_feed();
}



function waitfor_feed()
{
    let feed = null;
    Watch.childList(document.body, (node, observer) => {
        if(feed === null) {
            feed = lookfor_feed(node);
            if(feed !== null) {
                observer.disconnect();
                Watch.childList(feed, (node, observer) => {
                    Stream.of(lookfor_posts(feed)).map(remove_sponsored_posts);
                });
            }
        }
    });
}

function lookfor_feed(node)
{
    var node_iterator = document.createNodeIterator (
        node,
        NodeFilter.SHOW_ELEMENT,
        (descendant) => {
            if(descendant.getAttribute("role") === "feed")
                return NodeFilter.FILTER_ACCEPT;
        }
    );
    return node_iterator.nextNode();
}

function lookfor_posts(node)
{
    var node_iterator = document.createNodeIterator (
        node,
        NodeFilter.SHOW_ELEMENT,
        (descendant) => {
            if(descendant.getAttribute("data-testid") === "fbfeed_story")
                return NodeFilter.FILTER_ACCEPT;
        }
    );

    let filtered = [];
    let next = node_iterator.nextNode();
    while(next)
    {
        filtered.push(next);
        next = node_iterator.nextNode();
    }
    return filtered;
}

function lookfor_sponsored(node)
{
    var node_iterator = document.createNodeIterator (
        node,
        NodeFilter.SHOW_ELEMENT,
        (descendant) => {
            if(Stream.of(sponsored_class_list).anyMatch(bind(descendant.classList, "contains")))
                return NodeFilter.FILTER_ACCEPT;
        }
    );
    return node_iterator.nextNode();
}



var sponsored_class_list = [];
function get_sponsored_class_list()
{
    let sponsored = false;
    let sponsored_demo = false;
    let suggested = false;

    for (let i = 0; i < document.styleSheets.length; i++)
    {
        let rules =
            document.styleSheets[i].rules ||
            document.styleSheets[i].cssRules;

        if(rules)
            for (let x = 0; x < rules.length; x++)
            {
                let text = rules[x].cssText;
                if(!sponsored && text.indexOf('{ content: "Sponsored"; }') !== -1) {
                    sponsored = 1;
                    sponsored_class_list.push(text.slice(1,text.indexOf("::after")));
                }
                if(!sponsored_demo && text.indexOf('{ content: "Sponsored (demo)"; }') !== -1) {
                    sponsored_demo = 1;
                    sponsored_class_list.push(text.slice(1,text.indexOf("::after")));
                }
                if(!suggested && text.indexOf('{ content: "Suggested Post"; }') !== -1) {
                    suggested = 1;
                    sponsored_class_list.push(text.slice(1,text.indexOf("::after")));
                }
                if(sponsored_class_list.length === 3)
                    return;
            }
    }
}



function remove_sponsored_posts(node)
{
    if(sponsored_class_list.length !== 3)
        get_sponsored_class_list();

    if(lookfor_sponsored(node))
        remove(node);
}

function remove(node)
{
    let parent = node.parentNode;
    parent.removeChild(node);
}









// unused
function view_record_info(record)
{
    console.log("  type: "+record.type);
    console.log("  target: "); console.log(record.target);
    console.log("  addedNodes: "+record.addedNodes.length);
    console.log("  removedNodes: "+record.removedNodes.length);
    console.log("  nextSibling: "+record.nextSibling);
    console.log("  attributeName: "+record.attributeName);
    console.log("  attributeNamespace: "+record.attributeNamespace);
    console.log("  oldValue: "+record.oldValue);
}
