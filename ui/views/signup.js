var templates = require('handlebars').templates,
    profiles = require('../profiles'),
    session = require('session'),
    users = require('users'),
    async = require('async');


function showError(err) {
    $('#signup-form fieldset').prepend(
      '<div class="alert alert-error">' +
        '<a class="close" data-dismiss="alert">&times;</a>' +
        '<strong>Error</strong> ' +
        (err.message || err.toString()) +
      '</div>'
    );
}


module.exports = function () {
    var username, password;

    var login_form = $('#login-form');
    if (login_form.length) {
        username = $('#login_username', login_form).val();
        password = $('#login_password', login_form).val();
    }
    $('#content').html(templates['signup.html']({}));

    if (username) {
        $('#signup_username').val(username);
    }
    if (password) {
        $('#signup_password').val(password);
    }

    $('#signup_username').focus();

    $('#signup-form').submit(function (ev) {
        ev.preventDefault();

        var email = $('#signup_email').val();
        var username = $('#signup_username').val();
        var password = $('#signup_password').val();

        // clear validation/error messages
        $('.error', this).removeClass('error');
        $('.help-inline', this).text('');
        $('.alert', this).remove();

        if (!username) {
            var cg = $('#signup_username').parents('.control-group');
            cg.addClass('error');
            $('.help-inline', cg).text('Required');
        }
        if (!email) {
            var cg = $('#signup_email').parents('.control-group');
            cg.addClass('error');
            $('.help-inline', cg).text('Required');
        }
        if (!password) {
            var cg = $('#signup_password').parents('.control-group');
            cg.addClass('error');
            $('.help-inline', cg).text('Required');
        }
        if (!email || !username || !password) {
            return;
        }

        $('#signup_submit').button('loading');

        async.series([
            session.logout,
            async.apply(users.create, username, password),
            async.apply(session.login, username, password),
            // save email address to user doc
            function (cb) {
                users.get(username, function (err, doc) {
                    if (err) {
                        return cb(err);
                    }
                    doc.email = email;
                    users.update(username, password, doc, cb);
                });
            },
            async.apply(profiles.create, username, email)
        ],
        function (err) {
            if (err) {
                // TODO: roll-back user creation ?

                $('#signup_submit').button('reset');
                if (err.status === 0) {
                    showError(new Error(
                        'Request timed out, please check your connection.'
                    ));
                }
                else if (err.status === 409 || err.status === 404) {
                    showError(new Error('User already exists'));
                }
                else {
                    showError(err);
                }
                return;
            }
            window.location = '#/profile/' + encodeURIComponent(username);
        });

        return false;
    });
};
