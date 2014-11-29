$('document').ready(function () {
    $('.nav-menu-button').on('click', function (e) {
        $('#nav').toggleClass('active');
    });
    viewDocument();
    $('#list').on('click', '.haroonote-item', function (e) {
        var id = $(this).data('id');
        viewDocument(id);
    })
});

function viewDocument(id) {
    if (!id) id = 1;
    $('.haroonote-content').hide();
    $('.haroonote-content[data-id=' + id + ']').show();
}