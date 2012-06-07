var templates = require('handlebars').templates,
    profiles = require('../profiles'),
    gravatar = require('gravatar');


module.exports = function () {
    $('#content').html(
        templates['home.html']({})
    );
    showProfiles();
};

function showProfiles(start_key, descending) {
    var q = {
        include_docs: true,
        limit: 8,
        descending: descending
    };
    if (start_key) {
        q.limit += 1;
        q.skip = 1;
    }
    profiles.getAll(q, function (err, data) {
        if (err) {
            return alert(err);
        }
        for (var i = 0; i < data.rows.length; i ++) {
            data.rows[i].gravatar_url = gravatar.avatarURL({
                hash: data.rows[i].doc.gravatar,
                size: 48,
                default_image: 'identicon'
            });
        }
        $('#profilelist').html(
            templates['profile_list.html'](data)
        );

        var prev = $('#profilelist-nav .prev-link');
        prev.off('click');

        var next = $('#profilelist-nav .next-link');
        next.off('click');

        var end = data.offset + data.rows.length;

        if ((!descending && data.offset > 0) ||
            (descending && end < data.tota_rows)) {
            prev.removeClass('disabled');
            prev.on('click', function (ev) {
                ev.preventDefault();
                var lis = $('#profilelist li');
                showProfiles($(lis[lis.length - 1]).attr('rel'), true);
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
                var lis = $('#profilelist li');
                showProfiles($(lis[lis.length - 1]).attr('rel'));
                return false;
            });
        }
        else {
            next.addClass('disabled');
        }

        if (descending) {
            $('#profilelist-nav .start').text(data.total_rows - end);
            $('#profilelist-nav .end').text(data.total_rows - data.offset);
            $('#profilelist-nav .total').text(data.total_rows);
        }
        else {
            $('#profilelist-nav .start').text(data.offset);
            $('#profilelist-nav .end').text(end);
            $('#profilelist-nav .total').text(data.total_rows);
        }
    });
};
