exports.rewrites = [
    {from: '/', to: 'index.html'},
    {from: '/*', to: '*'}
];

exports.views = {
    profiles: {
        map: function (doc) {
            if (doc.type === 'profile') {
                emit(doc.name, null);
            }
        }
    }
};

exports.validate_doc_update = function (newDoc, oldDoc, userCtx) {
    var action = oldDoc ? (newDoc._deleted ? 'remove': 'update'): 'create';

    if ((oldDoc && oldDoc.type === 'profile') || newDoc.type === 'profile') {
        if (action === 'update' || action === 'create') {
            if (newDoc.website && !/^https?:\/\//.test(newDoc.website)) {
                throw {forbidden: 'Website must include http:// or https://'};
            }
            if (newDoc.twitter && !/^[A-Za-z0-9_]+$/.test(newDoc.twitter)) {
                throw {forbidden: 'Invalid twitter username'};
            }
        }
        for (var i = 0; i < userCtx.roles.length; i++) {
            if (userCtx.roles[i] === '_admin') {
                // _admin users can do anything provided it's a valid doc
                return;
            }
        }
        if (!userCtx.name) {
            throw {unauthorized: 'You must be logged in'};
        }
        if (action === 'remove') {
            if (userCtx.name !== oldDoc.name) {
                throw {unauthorized: 'Only the owner can remove a profile'};
            }
        }
        else if (action === 'update') {
            if (userCtx.name !== oldDoc.name) {
                throw {unauthorized: 'Only the owner can update a profile'};
            }
        }
        else if (action === 'create') {
            if (userCtx.name !== newDoc.name) {
                throw {unauthorized: 'profile.name must match your username'};
            }
        }
    }
};

exports.fulltext = {
    profiles: {
        index: function (doc) {
            if (doc.type === 'profile') {
                var ret = new Document();

                ret.add(doc.name, {boost: 2.0});
                ret.add(doc.full_name, {boost: 2.0});

                ret.add(doc.location, {field: 'location'});
                ret.add(new Date(doc.joined), {type: 'Date', field: 'joined'});
                ret.add(doc.website, {field: 'website'});
                ret.add(doc.twitter, {field: 'twitter'});
                ret.add(doc.bio, {field: 'bio'});

                return ret;
            }
        }
    }
};
