/* expects options object like the following
{
    url,
    redirect,
    form, (in jQuery selector)
    error, (function)
    pre
}
*/
function registerForm(options) {
    $(options.form).submit((e) => {
        if (options.pre) {
            options.pre(e)
        }

        e.preventDefault()
        var data = _($(options.form).serializeArray()).chain()
            .groupBy('name')
            .mapObject(arr => _(arr).map(item => item.value))
            .mapObject(arr => arr.length === 1 ? arr[0] : arr)
            .mapObject(item => typeof item === "string" ? item.trim() : item)
            .value()

        $.ajax({
            url: options.url,
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify(data),
            success: () => window.location.replace(typeof options.redirect === "string" ? options.redirect : options.redirect()),
            error: options.error
        })
    })
}

function repopulateBunksAndChugim(eidah, prefSelector, bunkSelector, chugSelector) {
    $(bunkSelector).empty();
    $(bunkSelector).append(`<option selected disabled value="">Select Bunk</option>`)
    $(bunkSelector).append(_(ctxt.bunks[eidah]).map(bunk => `<option value="${bunk}">${bunk}</option>`))

    for (selector of [prefSelector, chugSelector]) {
        //Populate Chug List
        $(selector).empty()
        $(selector).append(`<option disabled selected value="">Select Preference</option>`)
        $(selector).append(_(ctxt.chugim[eidah]).map(chug => `<option value="${chug._id}">${chug.name}</option>`))
    }
}

function sameIndeces(arr) {
    var duplicateVal = _(arr).chain()
        .countBy(ele => ele)
        .findKey(val => val > 1)
        .value()

    return _(arr).foldl((memo, val, index) => val === duplicateVal ? memo.concat([index]) : memo, [])
}

function registerTemporaryClass(selector, className, feedbackClass, feedbackText) {
    var initText = $(feedbackClass).text()
    if (feedbackText) {
        $(feedbackClass).text(feedbackText)
    }
    $(selector).addClass(className).focus().click(() => {
        $(selector).removeClass(className)
        $(feedbackClass).text(initText)
    })
}