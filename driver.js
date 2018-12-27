var _ = require('underscore');

function calculateHappiness(camper_data, chug_data) {
	for (var camper of camper_data) {
		var happiness = 0;
		var ind = 0
		for (var chug of camper.prefs) {
			//Happiness is capacity / popularity and weighted for order. Unhappier campers are lower values.
			happiness += chug_data[chug].capacity/chug_data[chug].popularity*(1-ind++*.25)
		}
		camper.happiness = happiness;
	}
}

function putKidsInChugim(camper_data, chug_data) {
	var noChug = [];

	_.each(chug_data, function(chug) {
		chug.kids = []
	});

	_.each(_.sortBy(camper_data, (camper) => {return camper.happiness}), function(camper) {
		var ind = 0;
		for (var chug of camper.prefs) {
			// If there is space in the chug
			if (chug_data[chug].kids.length < chug_data[chug].capacity) {
				// Put kid in chug
				chug_data[chug].kids.push(camper);
				// Assign chug to kid
				camper.chug = camper.prefs[ind]
				// Set which preference is recieved
				camper.pref_recieved = parseInt(ind) + 1;
				break;
			}

			// Didn't recieve preference
			if (ind == 2) {
				noChug.push(camper);
				camper.pref_recieved = -1;
			}
			ind++
		}
	});
	return noChug;
}

function getList(camper_data, chug_data) {
	chug_data = _.indexBy(chug_data, 'name');

	// Referencing means changes are reflected
	calculateHappiness(camper_data, chug_data);

	var noChug = putKidsInChugim(camper_data, chug_data);
	
	return {
		chugim: _.mapObject(chug_data, function(chug) {
			return chug.kids
		}),
		campers: _.map(camper_data, function(camper) {
			return {name: camper.name,
				chug: camper.chug,
				eidah: camper.eidah,
				bunk: camper.bunk,
				gender: camper.gender,
				pref_recieved: camper.pref_recieved}
		}),
		tears: _.map([1, 2, 3, -1], function(num) {
			return _.filter(camper_data, (kid) => {return kid.pref_recieved === num}).length
		}),
		noChug: noChug
	}
}

module.exports = {
	getList: getList
}