var templates = require('handlebars').templates,
    session = require('session'),
    async = require('async'),
    profiles = require('../profiles'),
    users = require('users');


function showError(err) {
    $('#login-form fieldset').prepend(
      '<div class="alert alert-error">' +
        '<a class="close" data-dismiss="alert">' +
          '&times;' +
        '</a>' +
        '<strong>Error</strong> ' +
        (err.message || err.toString()) +
      '</div>'
    );
}

module.exports = function (next) {
    var username, password;

    var signup_form = $('#signup-form');
    if (signup_form.length) {
        username = $('#signup_username', signup_form).val();
        password = $('#signup_password', signup_form).val();
    }
    $('#content').html(templates['login.html']({}));

    if (username) {
        $('#login_username').val(username);
    }
    if (password) {
        $('#login_password').val(password);
    }

    $('#login_username').focus();

    $('#login-form').submit(function (ev) {
        ev.preventDefault();

        var username = $('#login_username').val();
        var password = $('#login_password').val();

        // clear validation/error messages
        $('.error', this).removeClass('error');
        $('.help-inline', this).text('');
        $('.alert', this).remove();

        if (!username) {
            var cg = $('#login_username').parents('.control-group');
            cg.addClass('error');
            $('.help-inline', cg).text('Required');
        }
        if (!password) {
            var cg = $('#login_password').parents('.control-group');
            cg.addClass('error');
            $('.help-inline', cg).text('Required');
        }
        if (!username || !password) {
            return;
        }

        $('#login_submit').button('loading');

        session.login(username, password, function (err, res) {
            if (err) {
                $('#login_submit').button('reset');
                if (err.status === 0) {
                    showError(new Error(
                        'Request timed out, please check your connection.'
                    ));
                }
                else {
                    showError(err);
                }
                return;
            }
            next = next ? decodeURIComponent(next): null;
            checkProfile(username, next, function (err, next) {
                if (err) {
                    return alert(err);
                }
                window.location = next;
            });
        });

        return false;
    });
};


function checkProfile(username, next, callback) {
    profiles.get(username, function (err, doc) {
        if (err && err.status === 404) {
            var create_profile = confirm(
                'This user is missing a profile document.\n' +
                'Would you like to create one now?'
            );
            if (create_profile) {
                users.get(username, function (err, userDoc) {
                    if (err) {
                        return callback(err);
                    }
                    profiles.create(username, userDoc.email, function (err) {
                        if (err) {
                            return callback(err);
                        }
                        return callback(
                            null,
                            '#/profile/' + encodeURIComponent(username)
                        );
                    });
                });
                return;
            }
        }
        return callback(null, next || '#/profile/' + encodeURIComponent(username));
    });
}
