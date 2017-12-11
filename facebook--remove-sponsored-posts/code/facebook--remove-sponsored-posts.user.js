// ==UserScript==
// @name            facebook--remove-sponsored-posts
// @namespace       https://github.com/ericchase
// @version         0.1
// @author          https://github.com/ericchase
// @description     Tries to remove posts that have the "Sponsored" tag.
// @source          https://github.com/ericchase/userscripts/tree/master/facebook--remove-sponsored-posts
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


// Above is the default heading for Tampermonkey userscripts that I personally use.
// It includes most of the important @tributes (attributes).

// This is the default function provided by a new Tampermonkey userscript.
(function () {
    // The 'use strict' clause is a javascript option and changes the way certain things work.
    // I don't know the consequences of not using it, so I let it be.
    'use strict';

    // A consequence of 'use strict' is that variables are loaded differently.
    // As a workaround, I initialize any global variables that need to be preloaded first.
    //      Note that functions that have this problem.
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

var Stream;
var Watch;

function preload()
{
    // This class is meant to mimic the Java SE 8 stream interface.
    // References:
    //      https://docs.oracle.com/javase/8/docs/api/java/util/stream/package-summary.html
    //      https://docs.oracle.com/javase/8/docs/api/java/util/stream/Stream.html
    //      https://docs.oracle.com/javase/8/docs/api/java/util/stream/IntStream.html
    //
    // I've only included the functions that I use for this script.
    Stream = class
    {
        constructor()
        {
            this.elements = [];
        }

        // Returns a sequential ordered stream whose elements are the specified values.
        // For this script, any javascript object that has maps for 1..n and a 'length' value.
        static of(array)
        {
            let newStream = new Stream();
            for (let n = 0; n < array.length; ++n)
                newStream.elements.push(array[n]);
            return newStream;
        }

        // Returns whether any elements of this stream match the provided predicate.
        // A predicate is a boolean-valued function (with usually one argument).
        //      In short, if the conditional applies to the argument, return true.
        anyMatch(predicate)
        {
            let list = this.elements;
            for(let n in list)
                if(predicate(list[n]))
                    return true;
            return false;
        }

        // Returns a stream consisting of the elements of this stream that match the given predicate.
        // A predicate is a boolean-valued function (with usually one argument).
        //      In short, if the conditional applies to the argument, return true.
        filter(predicate)
        {
            let list = this.elements;
            let filteredStream = new Stream();
            for(let n in list)
                if(predicate(list[n]))
                    filteredStream.elements.push(list[n]);
            return filteredStream;
        }

        // Performs an action for each element of this stream.
        // The order is not guaranteed in Java, but in javascript, it's your guess.
        // A consumer is an operation that accepts a single input argument and returns no result.
        //      Unlike most other functional interfaces, Consumer is expected to operate via side-effects.
        forEach(consumer)
        {
            let list = this.elements;
            for(let n in list)
                consumer(list[n]);
        }
    };


    // This class was meant to encapsulate the MutationObserver concept.
    // It may or may not stick around.
    Watch = class
    {
        static childList(node, callback)
        {
            let handler = function(records, observer) {
                Stream.of(records).forEach(
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



// Uses a MutationObserver to continually search the DOM for the element that corresponds
//   to the facebook wall feed. Each time the wall is updated, 'lookfor_feed' is called,
//   which loops through an elements descendants looking for the feed element.
// Once the feed element is found, another MutationObserver is used to search for any and
//   all post elements. Once found, it feeds a stream of posts to 'remove_sponsored_posts'.
function waitfor_feed()
{
    let feed = null;
    Watch.childList(document.body, (node, observer) => {
        if(feed === null) {
            feed = lookfor_feed(node);
            if(feed !== null) {
                observer.disconnect();
                Watch.childList(feed, (node, observer) => {
                    Stream.of(lookfor_posts(feed)).forEach(remove_sponsored_posts);
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


// Searches a post for any element that contain a sponsored css class (which is found via the
//   'get_sponsored_class_list' function). If the post is sponsored, it is fed into the 'remove'
//   function.
function remove_sponsored_posts(node)
{
    if(sponsored_class_list.length !== 3)
        get_sponsored_class_list();

    if(lookfor_sponsored(node))
        remove(node);
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
