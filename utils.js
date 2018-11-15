var fs = require('fs')
var _ = require('underscore');
var capitalize = require('capitalize');

function getChugim(obj) {
	var chugim = {
		aleph: [],
		vav: [],
		bet: [],
		gimmel: [],
		daled: []
	}

	// For each chug, calculate eidot with that chug and put into that array in the object
	_.each(chugim, function(arr, eidah) {
		var filtered = _.filter(obj.klugim, function(elt) {
			return (elt.eidot.includes(eidah));
		}) 
		chugim[eidah] = _.pluck(filtered, 'name')
	})
	return chugim
}


function titleCase(str) {
	return str.split(' ').map(function(word) {
		if (word == "bbq") return word.toUpperCase();
		else if (word == "and" || word == "or" || word == "for" || word == "of" || word == "on") return word;
		else return capitalize(word);
	}).join(' ');
}

function callbackErr (err) {
	if (err) throw err;
}

module.exports = {
	getChugim: getChugim,
	titleCase: titleCase,
	callbackErr: callbackErr
}

