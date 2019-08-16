// reset bunk and chug list when eidah is clicked
$(".eidah").change((e) => {
    repopulateBunksAndChugim(e.target.value, ".pref", "#bunk")
});

registerForm({
    url: `/chugim/${ctxt.sessionID}`,
    redirect: () => `/chugim/${ctxt.sessionID}?name=${$("#name").val()}`, // function so that name is evaluated at runtime
    form: "#chug-form",
    error: (data) => {
        if (data.responseText.includes("camper already entered")) {
            registerTemporaryClass("#name", "is-invalid")
        } else {
            alert(data.responseText)
        }
    },
    pre: (event) => {
        var invalidIndeces = sameIndeces(_($(".pref")).map(pref => pref.value));
        if (invalidIndeces.length) {
            registerTemporaryClass(_(invalidIndeces).map(ind => $(".pref")[ind]), "is-invalid")

            event.preventDefault()
        }

        // illegal characters
        var match = $("#name").val().match(/[\(\)]/);
        if (match) {
            registerTemporaryClass("#name", "is-invalid", "#name-feedback", `Invalid character: ${match[0]}`);

            event.preventDefault()
        }
    }
})