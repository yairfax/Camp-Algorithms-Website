/* expects options object like the following
{
    url,
    redirect,
    form, (in jQuery selector)
    error (function)
}
*/
function registerForm(options) {
    $(".btn-submit").click(() => {
        var data = $(options.form).serializeArray()

        data = _.indexBy(data, 'name')
        data = _.mapObject(data, item => item.value)

        $.ajax({
            url: options.url,
            method: "POST",
            data: data,
            success: () => window.location.replace(options.redirect),
            error: options.error
        })
    })
}