var fs = require('fs')
var _ = require('underscore');
var capitalize = require('capitalize');

function getChugim(session) {
	// For each chug, calculate eidot with that chug and put into that array in the object
	return _.reduce(["aleph", "vav", "bet", "gimmel", "daled"], (memo, eidah) => {
		memo[eidah] = _.pluck(session.chugim.filter(elt => elt.eidot.includes(eidah)), 'name')
		return memo
	}, {})
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

