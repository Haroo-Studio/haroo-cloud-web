var dashboard = {
    id: 1,
    page: 1,
    init: function ($list, $content) {
        this.id = 1;
        this.page = 1;
        this.list = $list;
        this.content = $content;
        this.viewDocument();
    },
    nextID: function () {
        if (this.id > 0) this.id++;
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

        // if mobile width
        // position: absolute, top: 40px, background: white, height: 100%
    }
};

$('document').ready(function () {
    dashboard.init($('.haroonote-item'), $('.haroonote-content'));

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
    });
});
