var fs = require('fs')
var _ = require('underscore');
var capitalize = require('capitalize');

function getChugim(session) {
	return _(session.chugim).chain()
		.map(chug => // map each chug to a list of [{chug, eidah},{chug, eidah}]
			_(chug.eidot).map(eidah => ({
				name: chug.name,
				eidah: eidah,
				_id: chug._id
			})))
		.flatten() // flatten into one list
		.groupBy(chugRecord => chugRecord.eidah) // turn into object
		.mapObject(eidahGroup =>
			_(eidahGroup).map(chug => ({ // turn eidah into exclusive key
				name: chug.name,
				_id: chug._id
			})))
		.value()
}


function titleCase(str) {
	return str.split(' ').map(function (word) {
		if (word == "bbq") return word.toUpperCase();
		else if (word == "and" || word == "or" || word == "for" || word == "of" || word == "on") return word;
		else return capitalize(word);
	}).join(' ');
}

function callbackErr(err) {
	if (err) throw err;
}

function sendError(res, code, msg) {
	res.status(code)
	res.send(msg)
}

module.exports = {
	getChugim: getChugim,
	titleCase: titleCase,
	callbackErr: callbackErr,
	sendError: sendError
}

