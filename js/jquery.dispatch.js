/**
 * jquery.dispatch.js
 * ==================
 *
 * A lightweight jQuery plugin for client-side URL handling. Dispatches
 * hash-based URLs to view functions, supports nested pattern objects,
 * regular expressions and :named parameters.
 *
 * Caolan McMahon
 * http://caolanmcmahon.com
 *
 */

(function ($) {


    /*
     * Accepts a nested set of object literals and creates a single-level object
     * by combining the keys.
     *
     * flattenKeys({'a': {'b': function(){}, 'c': function(){}}})
     * [['ab', function(){}], ['ac', function(){}]]
     *
     */

    function flattenKeys(obj, /*optional args: */acc, prefix, prev_method){
        acc = acc || [];
        prefix = prefix || '';
        Object.keys(obj).forEach(function(k){
            if(typeof obj[k] == 'function') {
                acc.push([prefix + k, obj[k]])
            }
            else {
                flattenKeys(obj[k], acc, prefix + k);
            }
        });
        return acc;
    }


    /*
     * Compiles the url patterns to a reqular expression, returning an array
     * of arrays.
     *
     * compileKeys([['abc', function(){}], ['xyz', function(){}]])
     * [[/^abc$/, function(){}], [/^xyz$/, function(){}]]
     */

    function compileKeys(urls){
        return urls.map(function(url){
            // replace named params with regexp groups
            var pattern = url[0].replace(/\/:\w+/g, '(?:/([^\/]+))');
            url[0] = new RegExp('^' + pattern + '$');
            return url;
        });
    }


    /**
     * Creates a new URL dispatcher and binds to the hashchange event.
     *
     * Example:
     *
     *     $.dispatch({
     *         '/foo': function () { ... },
     *         '/hello/:name': function (name) { ... },
     *         '/user': {
     *             '/': function () { ... },
     *             '/posts': function () { .. },
     *             '/posts/(\\w+)': function (id) { ... }
     *         }
     *     });
     */

    $.dispatch = function (urls) {
        var compiled = compileKeys(flattenKeys(urls));
        var handler = function () {
            for (var i = 0, len = compiled.length; i < len; i++) {
                var x = compiled[i];
                var match = x[0].exec(window.location.hash.substr(1));
                if (match) {
                    x[1].apply(null, match.slice(1));
                    return;
                }
            }
        };
        $(window).bind('hashchange', handler);
    };


})(window.jQuery);
