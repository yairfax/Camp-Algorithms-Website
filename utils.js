var fs = require('fs')
var _ = require('underscore');
var capitalize = require('capitalize');

function getChugim(path) {
	var obj = JSON.parse(fs.readFileSync(path + "klugim-info.json"))
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
			return (elt.eidot.includes(eidah));
		}) 
		chugim[eidah] = _.pluck(filtered, 'name')
	})
	return chugim
}

function getFullChugim(path) {
	return JSON.parse(fs.readFileSync(path + "klugim-info.json"))
}

function writeChugData(obj, path) {
	fs.writeFileSync(path + "klugim-info.json", "[]")
	fs.writeFileSync(path + "klugim-info.json", JSON.stringify(obj));
}

function loadCamperPrefs(path) {
	if (!fs.existsSync(path + "camper-prefs.json")) {
		fs.writeFileSync(path + "camper-prefs.json", "[]")
		return []
	}
	return JSON.parse(fs.readFileSync(path + "camper-prefs.json"))
}

function writeCamperPrefs(obj, path) {
	fs.writeFileSync(path + "camper-prefs.json", JSON.stringify(obj))
}

function writeSession(obj) {
	fs.writeFileSync("sessions/sessions.json", JSON.stringify(obj));
}

function readSessions(obj) {
	return fs.readFileSync("sessions/sessions.json");
}

function titleCase(str) {
	return str.split(' ').map(function(word) {
		if (word == "bbq") return word.toUpperCase();
		else if (word == "and" || word == "or" || word == "for" || word == "of" || word == "on") return word;
		else return capitalize(word);
	}).join(' ');
}

module.exports = {
	getChugim: getChugim,
	writeCamperPrefs: writeCamperPrefs,
	loadCamperPrefs: loadCamperPrefs,
	titleCase: titleCase,
	writeSession: writeSession,
	readSessions, readSessions,
	writeChugData: writeChugData,
	getFullChugim: getFullChugim
}

