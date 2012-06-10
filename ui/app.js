exports.init = function (url) {
    $.dispatch({
        '':         require('./views/home'),
        '/':        require('./views/home'),
        '/signup':  require('./views/signup'),
        '/login':   require('./views/login'),
        '/login/:next':   require('./views/login'),
        '/profile/:id':   require('./views/profile')
    });
    $(window).trigger('hashchange');
};
