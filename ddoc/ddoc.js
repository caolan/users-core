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
    if ((oldDoc && oldDoc.type === 'profile') || newDoc.type === 'profile') {
        for (var i = 0; i < userCtx.roles.lenth; i++) {
            if (userCtx.roles[i] === '_admin') {
                // _admin users can do anything
                return;
            }
        }
        if (!userCtx.name) {
            throw {unauthorized: 'You must be logged in'};
        }
        if (oldDoc) {
            if (newDoc._deleted) {
                // remove
                if (userCtx.name !== oldDoc.name) {
                    throw {unauthorized: 'Only the owner can remove a profile'};
                }
            }
            else {
                // update
                if (userCtx.name !== oldDoc.name) {
                    throw {unauthorized: 'Only the owner can update a profile'};
                }
            }
        }
        else {
            // create
            if (userCtx.name !== newDoc.name) {
                throw {unauthorized: 'profile.name must match your username'};
            }
        }
    }
};
