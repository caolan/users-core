var templates = require('handlebars').templates,
    profiles = require('../profiles'),
    users = require('users'),
    gravatar = require('gravatar'),
    datelib = require('datelib'),
    db = require('db'),
    sanitize = require('sanitize'),
    async = require('async'),
    session = require('session');


module.exports = function (id) {
    users.get(id, function (err, userDoc) {
        if (err && err.status !== 404) {
            return console.error(err);
        }
        profiles.get(id, function (err, profileDoc) {
            if (err) {
                if (err.status === 404) {
                    $('#content').html(
                        '<div class="container page">' +
                        '<h1>Not Found</h1>' +
                        '<p>No profile found for user "' +
                            sanitize.h(id) + '"</p>' +
                        '</div>'
                    );
                    return;
                }
                return console.error(err);
            }
            var pp_joined = null;
            if (profileDoc.joined) {
                pp_joined = datelib.prettify(new Date(profileDoc.joined));
            }
            var userCtx = session.userCtx;

            $('#content').html(
                templates['profile.html']({
                    profile: profileDoc,
                    userDoc: userDoc,
                    pp_joined: pp_joined,
                    isCurrentUser: userDoc && userCtx.name === profileDoc.name,
                    gravatar_url: gravatar.avatarURL({
                        hash: profileDoc.gravatar || 'default',
                        size: 128,
                        default_image: 'identicon',
                    })
                })
            );
            bindProfileForm(userDoc, profileDoc);
        });
    });
};


function showEditForm(td) {
    var value = $('.value', td).hide();
    $('.field-editor', td).css({display: 'inline-block'});
    $('.field-editor .control-group', td).removeClass('error');
    $('.field-editor .help-inline', td).text('');
    if (value.hasClass('empty')) {
        $('.field-editor .field-editor-value', td).val('');
    }
    else {
        $('.field-editor .field-editor-value', td).val(
            value.text().replace(/^\s+/,'').replace(/\s+$/,'')
        );
    }
    $('.field-editor .field-editor-value', td).focus();
}

function updateDocs(form, userDoc, profileDoc) {
    var td = $(form).parents('td');

    var doc = $(td).data('doc');
    var prop = $(td).data('property');

    if (!doc) {
        // show error message
        throw new Error('unexpected data-doc value');
    }
    if (!prop) {
        // show error message
        throw new Error('unexpected data-property value');
    }

    var val = $('.field-editor-value', form).val();

    if (prop === 'twitter') {
        var m = /^\s*@?([A-Za-z0-9_]+)\s*$/.exec(val);
        if (m) {
            val = m[1];
        }
        else {
            var m2 = /^\s*https?:\/\/twitter.com\/(?:#!\/)?([A-Za-z0-9_]+)\s*$/.exec(val);
            if (m2) {
                val = m2[1];
            }
        }
    }
    else if (prop === 'email') {
        profileDoc['gravatar'] = gravatar.hash(val);
    }

    if (doc === 'profile') {
        profileDoc[prop] = val;
    }
    else if (doc === 'user') {
        userDoc[prop] = val;
    }
}

function submitEditForm(form, userDoc, profileDoc) {
    var td = $(form).parents('td');
    $('.btn-primary', form).button('load');

    var oldUserDoc = JSON.stringify(userDoc);
    var oldProfileDoc = JSON.stringify(profileDoc);

    updateDocs(form, userDoc, profileDoc);

    async.parallel({
        userDoc: function (cb) {
            if (oldUserDoc !== JSON.stringify(userDoc)) {
                return users.saveDoc(userDoc, cb);
            }
            cb(null, {rev: userDoc._rev});
        },
        profileDoc: function (cb) {
            if (oldProfileDoc !== JSON.stringify(profileDoc)) {
                return profiles.getProfileDB().saveDoc(profileDoc, cb);
            }
            cb(null, {rev: profileDoc._rev});
        }
    },
    function (err, results) {
        $('.btn-primary', form).button('reset');
        if (err) {
            $('.control-group', form).addClass('error');
            $('.help-inline', form).text(
                err.message || err.toString()
            );
            return console.error(err);
        }
        userDoc._rev = results.userDoc.rev;
        profileDoc._rev = results.profileDoc.rev;

        $('.control-group', form).removeClass('error');
        $('.help-inline', form).text('');
        $(form).css({display: 'none'});
        var value = $('.value', td).show();
        $('.edit-link', td).show();

        var val;
        var doc = $(td).data('doc');
        var prop = $(td).data('property');
        if (doc === 'user') {
            val = userDoc[prop];
        }
        else if (doc === 'profile') {
            val = profileDoc[prop];
        }

        if (val) {
            if (prop === 'twitter') {
                value.html(
                    '<a href="http://twitter.com/' +
                    encodeURIComponent(val) + '"></a>'
                );
                $('a', value).text('@' + val);
                value.removeClass('empty');
            }
            else if (prop === 'website') {
                value.html(
                    '<a href="' + sanitize.h(val) + '"></a>'
                );
                $('a', value).text(val);
                value.removeClass('empty');
            }
            else if (prop === 'password') {
                value.text('(Hidden)');
                value.addClass('empty');
            }
            else {
                value.text(val);
                value.removeClass('empty');
            }

            if (prop === 'email') {
                var gravatar_url = gravatar.avatarURL({
                    hash: profileDoc.gravatar || 'default',
                    size: 128,
                    default_image: 'identicon',
                });
                $('img.avatar').attr({src: gravatar_url});
            }
        }
        else {
            value.text('Empty');
            value.addClass('empty');
        }
    });
}

function cancelEditForm(form) {
    var td = $(form).parents('td');
    $('.control-group', form).removeClass('error');
    $('.help-inline', form).text('');
    $(form).css({display: 'none'});
    var value = $('.value', td).show();
    $('.field-editor-value', form).val('');
    $('.edit-link', td).show();
}

function bindProfileForm(userDoc, profileDoc) {
    $('.profile-table td .edit-link').click(function (ev) {
        ev.preventDefault();
        $(this).hide();
        showEditForm($(this).parents('td'));
        return false;
    });
    $('.profile-table td .field-editor').submit(function (ev) {
        ev.preventDefault();
        submitEditForm(this, userDoc, profileDoc);
        return false;
    });
    $('.profile-table td .field-editor .btn-cancel').click(function (ev) {
        ev.preventDefault();
        cancelEditForm($(this).parents('form'));
        return false;
    });
}
