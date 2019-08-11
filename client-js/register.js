$(function () {
    $("#register-submit").click(() => {
        var data = $("#register-form").serializeArray()

        data = _.indexBy(data, 'name')
        data = _.mapObject(data, item => item.value)

        $.ajax({
            url: "/register",
            method: "POST",
            data: data,
            success: () => window.location.replace("/chugim/klugie"),
            error: (data, text, err) => {
                if (data.responseText.includes("username already exists")) {
                    $("#username").addClass('is-invalid')
                } else {
                    alert(data.responseText)
                }
            }
        })
    })
})