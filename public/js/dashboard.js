var dashboard = {
    id: 1,
    id_max: 0,
    page: 1,
    init: function ($list, $content) {
        this.id = 1;
        this.page = 1;
        this.list = $list;
        this.content = $content;
        this.viewDocument();
    },
    nextID: function () {
        if (this.id < this.id_max) this.id++;
        this.viewDocument();
    },
    prevID: function () {
        if (this.id > 1) this.id--;
        this.viewDocument();
    },
    nextPage: function () {
        if (this.page > 0) this.page++;
        this.id = 1;
        console.log(this.page, this.id);
    },
    prevPage: function () {
        if (this.page > 1) this.page--;
        this.id = 1;
        console.log(this.page, this.id);
    },
    changeDocument: function (viewID) {
        this.id = viewID;
        this.viewDocument();
    },
    viewDocument: function () {
        var viewID = this.id;
        var selectClass = 'haroonote-item-selected';

        this.list.removeClass(selectClass);
        this.content.hide();
        this.list.filter('[data-id=' + viewID + ']').addClass(selectClass);
        var view = this.content.filter('[data-id=' + viewID + ']').show().children('.haroonote-content-body');

        if (!view.hasClass('rendered')) {
            //todo: bind haroopad markdown renderer
            //var markdown = view.html();
            //var rendered = markdownIt.render(markdown);
            //view.addClass('rendered');
            //view.html(rendered);
        }
    }
};

var dashboardViewCtrl = {
    token: '',
    toggleImportant: function (viewID, callback) {
        $.post('/dashboard/' + viewID + '/important', {_csrf: this.token}, function (result) {
            if (result.code) {
                callback(result.important);
            }
        });
    },
    togglePublic: function (viewID, callback) {
        $.post('/dashboard/' + viewID + '/public', {_csrf: this.token}, function (result) {
            if (result.code) {
                callback(result.public, result.shareUrl && result.shareUrl);
            }
        });
    },
    toggleLink: function ($el, linkUrl) {
        if ($el.attr('href')) {
            $el.attr('href', '');
            $el.hide();
        } else {
            $el.attr('href', "/p/" + linkUrl);
            $el.show();
        }
    },
    toggleAction: function ($el, isPublic) {
        if (isPublic) {
            !$el.hasClass('pure-button-active') && $el.addClass('pure-button-active');
        } else {
            $el.hasClass('pure-button-active') && $el.removeClass('pure-button-active');
        }
    }
};

$('document').ready(function () {
    var $nav = $('#nav'), $list = $('#list'), $main = $('#main');

    dashboard.init($('.haroonote-item'), $('.haroonote-content'));
    dashboard.id_max = $nav.find('ul.category-menu').data('id');

    // responsive controls
    $nav.find('.nav-menu-button').on('click', function () {
        $nav.toggleClass('active');
    });

    $nav.find('.nav-footer').on('click', '.footer-head', function () {

        $nav.find('.nav-footer .footer-content').toggle();
    });

    // preference panel
    $nav.on('click', '.preference-button', function () {
        var $preference = $('#preference');

        $preference.toggle();
        $preference.one('click', function () {
            $preference.hide();
        });
    });

    // bind keyboard
    keymage.setScope('dashboard.list');
    keymage('dashboard.list', 's', function () {
        return dashboard.nextPage();
    });
    keymage('dashboard.list', 'l', function () {
        return dashboard.nextPage();
    });
    keymage('dashboard.list', 'a', function () {
        return dashboard.prevPage();
    });
    keymage('dashboard.list', 'h', function () {
        return dashboard.prevPage();
    });
    keymage('dashboard.list', 'j', function () {
        return dashboard.nextID();
    });
    keymage('dashboard.list', 'k', function () {
        return dashboard.prevID();
    });

    // document view control
    $list.on('click', '.haroonote-item', function () {
        var bindID = $(this).data('id');
        dashboard.changeDocument(bindID);
        $('html,body').stop().animate({scrollTop: 0}, 500);
    });

    // ad button
    if ($.cookie('remove-premium-box') == 1) {
        $list.find('.go-premium').parent().hide();
    }
    $list.find('.go-premium .close-icon').one('click', function () {
        $(this).parent().parent().hide();
        $.cookie('remove-premium-box', '1', { expires: 7, path: '/' });
    });

    // document meta control, disabled for now, don't update core database from outside
    /*
    var viewControl = $main.children().find('.haroonote-content-controls');
    var toggleStr = {
        imp: '.important',
        pub: '.public',
        dwn: '.download'
    };

    dashboardViewCtrl.token = $main.data('id');

    viewControl.on('click', toggleStr.imp, function () {
        var that = $(this);
        var viewID = that.parent().data('id') || '';
        dashboardViewCtrl.toggleImportant(viewID, function (isImportant) {
            dashboardViewCtrl.toggleAction(that, isImportant);
        });
    });
    viewControl.on('click', toggleStr.pub, function () {
        var that = $(this);
        var viewID = that.parent().data('id') || '';
        dashboardViewCtrl.togglePublic(viewID, function (isPublic, shareUrl) {
            dashboardViewCtrl.toggleAction(that, isPublic);
            dashboardViewCtrl.toggleLink(that.siblings('a.link'), shareUrl)
        });
    });
    viewControl.on('click', toggleStr.dwn, function () {
        var that = $(this);
        var viewID = that.parent().data('id') || '';
        dashboardViewCtrl.togglePublic(viewID, function (isPublic) {
            dashboardViewCtrl.toggleAction(that, isPublic);
        });
    });
    */
});
