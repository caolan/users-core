exports.init = function (url) {
    var router = Router({
        '/':          require('./views/home'),
        '/search/*':  require('./views/home'),
        '/signup':    require('./views/signup'),
        '/login':     require('./views/login'),
        '/login/*':   require('./views/login'),
        '/profile/*': require('./views/profile')
    });
    router.configure({
        on: function () {
            if (typeof _gaq !== 'undefined') {
                // report page view to google analytics
                _gaq.push([
                    '_trackPageview',
                    location.pathname + location.search  + location.hash
                ]);
            }
        }
    });
    router.configure({
        on: function () {
            if (typeof _gaq !== 'undefined') {
                // report page view to google analytics
                _gaq.push([
                    '_trackPageview',
                    location.pathname + location.search  + location.hash
                ]);
            }
        }
    });
    router.init();
    if (!window.location.hash || window.location.hash === '#') {
        window.location = '#/';
        $(window).trigger('hashchange');
    }
};
