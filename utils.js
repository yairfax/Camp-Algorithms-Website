var parse = require('csv-parse/lib/sync');
var fs = require('fs')
var _ = require('underscore');

function getChugim(path) {
	var obj = parse(fs.readFileSync(path + "klugim-info.csv"), {columns: true})
	var chugim = {
		aleph: [],
		vav: [],
		bet: [],
		gimmel: [],
		daled: []
	}

	// For each chug, calculate eidot with that chug and put into that array in the object
	_.each(chugim, function(arr, eidah) {
		var filtered = _.filter(obj, function(elt) {
			return (elt.Eidah.toLowerCase().includes(eidah) || elt.Eidah.toLowerCase().includes('all'));
		}) 
		chugim[eidah] = _.pluck(filtered, 'Chug')
	})
	return chugim
}

module.exports = {
	getChugim: getChugim
}
