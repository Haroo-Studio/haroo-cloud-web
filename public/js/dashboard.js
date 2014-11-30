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
        this.content.filter('[data-id=' + viewID + ']').show();
    }
};

var dashboardViewCtrl = {
    token: '',
    togglePublic: function (viewID, callback) {
        $.post('/dashboard/' + viewID + '/public', {_csrf: this.token}, function (result) {
            if (result.code) {
                callback(result.public);
            }
        });
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
    dashboard.init($('.haroonote-item'), $('.haroonote-content'));
    dashboard.id_max = $('#nav').find('ul.category-menu').data('id');

    // responsive controls
    $('.nav-menu-button').on('click', function (e) {
        $('#nav').toggleClass('active');
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
    $('#list').on('click', '.haroonote-item', function (e) {
        var bindID = $(this).data('id');
        dashboard.changeDocument(bindID);
        $('html,body').stop().animate({scrollTop: 0}, 500);
    });

    // document meta control
    var main = $('#main');
    var viewControl = main.children().find('.haroonote-content-controls');
    var toggleStr = {
        imp: '.important',
        pub: '.public',
        dwn: '.download'
    };

    dashboardViewCtrl.token = main.data('id');

    viewControl.on('click', toggleStr.imp, function (e) {
        var that = $(this);
        var viewID = that.parent().data('id') || '';
        dashboardViewCtrl.togglePublic(viewID, function (isPublic) {
            dashboardViewCtrl.toggleAction(that, isPublic);
        });
    });
    viewControl.on('click', toggleStr.pub, function (e) {
        var that = $(this);
        var viewID = that.parent().data('id') || '';
        dashboardViewCtrl.togglePublic(viewID, function (isPublic) {
            dashboardViewCtrl.toggleAction(that, isPublic);
        });
    });
    viewControl.on('click', toggleStr.dwn, function (e) {
        var that = $(this);
        var viewID = that.parent().data('id') || '';
        dashboardViewCtrl.togglePublic(viewID, function (isPublic) {
            dashboardViewCtrl.toggleAction(that, isPublic);
        });
    });
});
