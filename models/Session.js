const mongoose = require('mongoose')
const _ = require('underscore')

var camperSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
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
		type: [mongoose.Schema.Types.ObjectId],
		required: true
	},
	chug: mongoose.Schema.Types.ObjectId,
	pref_recieved: Number
})

var chugSchema = new mongoose.Schema({
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
	kids: [mongoose.Schema.Types.ObjectId]
})

var sessionSchema = new mongoose.Schema({
	id: {
		type: String,
		required: true,
		validate: {
			isAsync: true,
			validator: function (v, cb) {
				Session.findOne({ id: v }, (err, doc) => {
					if (err) return cb(err)

					cb(!doc, "session already exists")
				})
			}
		}
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
	chugim: [chugSchema],
	campers: {
		type: [camperSchema],
		validate: {
			isAsync: true,
			validator: function (v, cb) {
				var id = this.getQuery()
				var update = this.getUpdate()
				Session.findById(id, { campers: 1, _id: 0 }, (err, doc) => {
					if (err) return cb(err)

					if (_(doc.campers).filter(
						camper =>
							camper.name.toLowerCase().includes(update.$push.campers.name.toLowerCase()) ||
							update.$push.campers.name.toLowerCase().includes(camper.name.toLowerCase())).length > 0) {
						return cb(false, "camper already entered")
					}

					cb()
				})
			}
		}
	},
	produced: Boolean,
	lastProduction: Date,
	tears: [Number],
	noChug: [camperSchema]
})

var Session = mongoose.model('Session', sessionSchema);

module.exports = Session;