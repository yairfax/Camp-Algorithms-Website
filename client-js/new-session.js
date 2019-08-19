// creates new chug div
function getNewChug() {
    return $("<div>").append(`
    <div class="form-row">
        <div class="form-group col-md-5">
            <input class="form-control" id="name" type="text" placeholder="Chug Name" required></input>
            <div class="invalid-feedback">Please select eidot for this chug</div>
        </div>
        <div class="form-group col-md-2">
            <input class="form-control" id="pop" type="number" step=".1" min="0" max="1" placeholder="Popularity" required></input>
        </div>
        <div class="form-group col-md-2">
            <input class="form-control" id="cap" type="number" min="0" max="100" placeholder="Capacity" required></input>
        </div>
        <button type="button" id="delete" class="btn btn-danger delete-chug" style="height: 37px">-</button>
    </div>
    <div class="form-row">
        <div class="form-group">
            <div class="form-check form-check-inline">
                <input class="form-check-input eidot" type="checkbox" value="aleph">
                <label class="form-check-label" for="aleph">Aleph</label>
            </div>
            <div class="form-check form-check-inline">
                <input class="form-check-input eidot" type="checkbox" value="vav">
                <label class="form-check-label" for="vav">Vav</label>
            </div>
            <div class="form-check form-check-inline">
                <input class="form-check-input eidot" type="checkbox" value="bet">
                <label class="form-check-label" for="bet">Bet</label>
            </div>
            <div class="form-check form-check-inline">
                <input class="form-check-input eidot" type="checkbox" value="gimmel">
                <label class="form-check-label" for="gimmel">Gimmel</label>
            </div>
            <div class="form-check form-check-inline">
                <input class="form-check-input eidot" type="checkbox" value="daled">
                <label class="form-check-label" for="daled">Daled</label>
            </div>
            <div class="form-check form-check-inline">
                <input class="form-check-input eidot" type="checkbox" value="aleph,vav">
                <label class="form-check-label" for="aleph,vav">AV</label>
            </div>
            <div class="form-check form-check-inline">
                <input class="form-check-input eidot" type="checkbox" value="bet,gimmel,daled">
                <label class="form-check-label" for="bet,gimmel,daled">BGD</label>
            </div>
            <div class="form-check form-check-inline">
                <input class="form-check-input eidot" type="checkbox" value="aleph,vav,bet,gimmel,daled">
                <label class="form-check-label" for="aleph,vav,bet,gimmel,daled">All</label>
            </div>
        </div>
    </div>
    <hr>`)
}

// Adds chug to chug container
function addChug(newChug) {
    $("#chug-container").append(newChug);
    $(".delete-chug").on("click", function (event) {
        $(this).parentsUntil("#chug-container").remove();
    });
}

// Creates new chug and appends
$("#add-chug").on('click', function () {
    addChug(getNewChug());
});

$("#new-session-form").submit((e) => {
    e.preventDefault()
    data = {
        year: parseInt($("#year").val()),
        session: $("input[name=\"session\"]:checked").val(),
        bunks: _(ctxt.eidot).chain()
            .reduce((memo, eidah) =>
                memo.concat({
                    eidah: eidah.toLowerCase(),
                    bunks: _.map($(`.${eidah}`), ele => ele.value.trim())
                }), [])
            .indexBy('eidah')
            .mapObject(obj => obj.bunks)
            .value(),
        chugim: _($("#chug-container").contents()).map(chug => ({
            name: $(chug).find("#name").val().trim(),
            popularity: parseFloat($(chug).find("#pop").val()),
            capacity: parseInt($(chug).find("#cap").val()),
            eidot: _($(chug).find("input.eidot:checked")).chain()
                .reduce((memo, eidah) => memo.concat(eidah.value.split(',')), [])
                .uniq()
                .value()
        }))
    }
    // functional programming ftw

    $.ajax({
        url: "/chugim/klugie/session/new",
        method: "POST",
        data: JSON.stringify(data),
        contentType: "application/json",
        success: (session) => window.location.replace(`/chugim/klugie/${session}`),
        error: (err) => {
            if (err.responseText.includes("session already exists")) {
                registerTemporaryClass("#year", "is-invalid")
            } else {
                alert(err.responseText)
            }
        }
    })

})