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
		enum: ['aleph', 'vav', 'bet', 'gimmel', 'daled'],
		required: true
	},
	capacity: {
		type: Number,
		min: 0,
		max: 200,
		required: true
	},
	kids: [String]
})

var camperSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true
	},
	eidah: {
		type: String,
		required: true,
		enum: ['aleph', 'vav', 'bet', 'gimmel', 'daled']
	},
	gender: {
		type: String,
		required: true,
		enum: ['male', 'female']
	},
	bunk: {
		type: String,
		required: true
	},
	prefs: {
		type: [String],
		required: true
	},
	chug: String,
	pref_recieved: Number
})

var sessionSchema = new mongoose.Schema({
	_id: {
		type: String,
		required: true
	},
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
		enum: ['i', 'ii'],
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
	lastProduction: Date,
	tears: [Number],
	noChug: [String],
	chugCSV: String,
	camperCSV: String
})

var Session = mongoose.model('Session', sessionSchema);

module.exports = Session;