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

function loadCamperPrefs(path) {
	if (!fs.existsSync(path + "camper-prefs.json")) {
		fs.writeFileSync(path + "camper-prefs.json", "{}")
		return {}
	}
	return JSON.parse(fs.readFileSync(path + "camper-prefs.json"))
}

function writeCamperPrefs(obj, path) {
	fs.writeFileSync(path + "camper-prefs.json", JSON.stringify(obj))
}

module.exports = {
	getChugim: getChugim,
	writeCamperPrefs: writeCamperPrefs,
	loadCamperPrefs: loadCamperPrefs
}

