var mongoose = require('mongoose')

var klugSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true
	},
	popularity: {
		type: Number,
		min: 0,
		max: 1,
		required: true
	},
	eidot: {
		type: [String],
		required: true
	}
})

var camperSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true
	},
	eidah: {
		type: String,
		required: true
	},
	gender: {
		type: String,
		required: true
	},
	bunk: {
		type: String,
		required: true
	},
	prefs: {
		type: [String],
		required: true
	}
})

var sessionSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true
	},
	year: {
		type: Number,
		required: true,
		min: 2000,
		max: 3000
	},
	session: {
		type: String,
		required: true
	},
	id: {
		type: String,
		required: true
	},
	bunks: {
		type: Map,
		of: [String],
		required: true
	},
	active: {
		type: Boolean,
		required: true
	},
	klugim: [klugSchema],
	campers: [camperSchema],
})

var Session = mongoose.model('Session', sessionSchema);

module.exports = Session;