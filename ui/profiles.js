var db = require('db'),
    gravatar = require('gravatar'),
    datelib = require('datelib'),
    url = require('url'),
    app = require('./app'),
    cfg = require('settings/root');


exports.getProfileDB = function () {
    if (cfg.profiles && cfg.profiles.url) {
        return db.use(cfg.profiles.url);
    }
    return db.current();
};

exports.getProfileDBName = function () {
    if (cfg.profiles && cfg.profiles.db) {
        return cfg.profiles.db;
    }
    var curr = db.guessCurrent();
    if (!curr) {
        throw new Error('Cannot determine profile db name from URL');
    }
    return curr.db;
};

exports.getProfileLucene = function () {
    if (!cfg.profiles || !cfg.profiles.lucene) {
        throw new Error('lucene not configured');
    }
    return cfg.profiles.lucene;
};

exports.search = function (options, callback) {
    var dbname = exports.getProfileDBName();
    var lucene_key = exports.getProfileLucene();
    var ddoc = '_design/' + encodeURIComponent(cfg.name);
    var index = 'profiles';

    var search_url = url.format({
        protocol: location.protocol,
        host: location.host,
        pathname: ['/_fti', lucene_key, dbname, ddoc, index].join('/')
    });
    var opt = {
        type: 'GET',
        url: search_url,
        data: options,
        expect_json: true
    };
    db.request(opt, callback);
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
    exports.getProfileDB().getView(cfg.name, 'profiles', q, callback);
};

exports.get = function (id, callback) {
    exports.getProfileDB().getDoc(id, callback);
};
