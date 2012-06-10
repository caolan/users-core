var templates = require('handlebars').templates,
    profiles = require('../profiles'),
    gravatar = require('gravatar'),
    cfg = require('settings/root');


// max number of profiles to list on page
var PAGE_LENGTH = 5;

module.exports = function () {
    $('#content').html(
        templates['home.html']({})
    );
    if (cfg.profiles && cfg.profiles.lucene) {
        $('#user-search-form').show();
        $('#user-search-form').submit(function (ev) {
            ev.preventDefault();
            var q = $('#user-search-q', this).val();
            searchProfiles(q);
            return false;
        });$
        $('#user-search-q').keyup($.debounce(500, function () {
            var q = $(this).val();
            searchProfiles(q);
        }));
        $('#user-search-q').focus();
    }
    getProfiles();
};


function getProfiles(start_key, descending) {
    $('#user-search-form .control-group').removeClass('error');
    $('#user-search-form .help-inline').text('');
    $('#user-search-submit').button('loading');
    var q = {
        include_docs: true,
        limit: PAGE_LENGTH,
        descending: descending,
        start_key: start_key
    };
    if (start_key) {
        q.limit += 1;
        q.skip = 1;
    }
    profiles.getAll(q, function (err, data) {
        $('#user-search-submit').button('reset');
        if (err) {
            $('#user-search-form .help-inline').text(err.message || err);
            $('#user-search-form .control-group').addClass('error');
            return console.error(err);
        }
        updateList(data);
        bindStandardNav(data, descending);
    });
}


function searchProfiles(q, skip) {
    if (!q) {
        return getProfiles();
    }
    $('#user-search-form .control-group').removeClass('error');
    $('#user-search-form .help-inline').text('');
    $('#user-search-submit').button('loading');
    if (!/\s/.test(q)) {
        // if only a single word add a wildcard
        if (q.substr(q.length-1, 1) !== '*') {
            q += '*';
        }
    }
    profiles.search({
        q: q,
        include_docs: true,
        limit: PAGE_LENGTH,
        skip: skip || 0
    },
    function (err, data) {
        $('#user-search-submit').button('reset');
        if (err) {
            $('#user-search-form .help-inline').text(err.message || err);
            $('#user-search-form .control-group').addClass('error');
            return console.error(err);
        }
        updateList(data);
        bindSearchNav(q, data);
    });
}


function updateList(data) {
    for (var i = 0; i < data.rows.length; i ++) {
        data.rows[i].gravatar_url = gravatar.avatarURL({
            hash: data.rows[i].doc.gravatar,
            size: 48,
            default_image: 'identicon'
        });
    }
    $('#profile-list').html(
        templates['profile_list.html'](data)
    );
}


function bindStandardNav(data, descending) {
    var prev = $('#profile-list-nav .prev-link');
    prev.off('click');

    var next = $('#profile-list-nav .next-link');
    next.off('click');

    var end = data.offset + data.rows.length;

    if ((!descending && data.offset > 0) ||
        (descending && end < data.tota_rows)) {
        prev.removeClass('disabled');
        prev.on('click', function (ev) {
            ev.preventDefault();
            var lis = $('#profile-list li');
            var start_key = JSON.stringify($(lis[lis.length - 1]).attr('rel'));
            getProfiles(start_key, true);
            return false;
        });
    }
    else {
        prev.addClass('disabled');
    }
    if ((!descending && end < data.total_rows) ||
        (descending && data.offset > 0)) {
        next.removeClass('disabled');
        next.on('click', function (ev) {
            ev.preventDefault();
            var lis = $('#profile-list li');
            var start_key = JSON.stringify($(lis[lis.length - 1]).attr('rel'));
            getProfiles(start_key, false);
            return false;
        });
    }
    else {
        next.addClass('disabled');
    }

    if (descending) {
        $('#profile-list-nav .start').text(data.total_rows - end + 1);
        $('#profile-list-nav .end').text(data.total_rows - data.offset);
        $('#profile-list-nav .total').text(data.total_rows);
    }
    else {
        $('#profile-list-nav .start').text(data.offset + 1);
        $('#profile-list-nav .end').text(end);
        $('#profile-list-nav .total').text(data.total_rows);
    }
}

function bindSearchNav(q, data) {
    var prev = $('#profile-list-nav .prev-link');
    prev.off('click');

    var next = $('#profile-list-nav .next-link');
    next.off('click');

    var end = data.skip + data.rows.length;

    if (data.skip > 0) {
        prev.removeClass('disabled');
        prev.on('click', function (ev) {
            ev.preventDefault();
            searchProfiles(q, Math.max(0, data.skip - PAGE_LENGTH));
            return false;
        });
    }
    else {
        prev.addClass('disabled');
    }
    if (end < data.total_rows) {
        next.removeClass('disabled');
        next.on('click', function (ev) {
            ev.preventDefault();
            searchProfiles(q, end);
            return false;
        });
    }
    else {
        next.addClass('disabled');
    }

    $('#profile-list-nav .start').text(data.skip + 1);
    $('#profile-list-nav .end').text(end);
    $('#profile-list-nav .total').text(data.total_rows);
}
