exports.dburl = null;

exports.init = function (url) {
    if (url) {
        exports.dburl = url;
    }
    $.dispatch({
        '':         require('./views/home'),
        '/':        require('./views/home'),
        '/signup':  require('./views/signup'),
        '/login':   require('./views/login'),
        '/login/:next':   require('./views/login'),
        '/view/:id':   require('./views/profile')
    });
    $(window).trigger('hashchange');
};
