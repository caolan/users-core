var db = require('db'),
    gravatar = require('gravatar'),
    datelib = require('datelib'),
    app = require('./app');


exports.getProfileDB = function () {
    var profiledb;
    if (app.dburl) {
        profiledb = db.use(app.dburl);
    }
    else {
        profiledb = db.current();
    }
    return profiledb;
};

exports.create = function (username, email, callback) {
    var doc = {
        _id: username,
        type: 'profile',
        name: username,
        gravatar: email ? gravatar.hash(email): null,
        joined: datelib.ISODateString()
    };
    exports.getProfileDB().saveDoc(doc, callback);
};

exports.getAll = function (q, callback) {
    if (!callback) {
        callback = q;
        q = {};
    }
    exports.getProfileDB().getView('users-app', 'profiles', q, callback);
};

exports.get = function (id, callback) {
    exports.getProfileDB().getDoc(id, callback);
};
