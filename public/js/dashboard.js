$('document').ready(function () {
    // responsive controls
    $('.nav-menu-button').on('click', function (e) {
        $('#nav').toggleClass('active');
    });

    // document view control
    var $list = $('.haroonote-item');
    var $content = $('.haroonote-content');

    viewDocument($list, $content);
    $('#list').on('click', '.haroonote-item', function (e) {
        var bindID = $(this).data('id');
        viewDocument($list, $content, bindID);
    })
});

function viewDocument(list, content, id) {
    if (!id) id = 1;
    var selectClass = 'haroonote-item-selected';

    list.removeClass(selectClass);
    content.hide();
    list.closest('[data-id=' + id + ']').addClass(selectClass);
    content.closest('[data-id=' + id + ']').show();
}