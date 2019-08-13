var mongoose = require('mongoose')

var userSchema = new mongoose.Schema({
	pswd: {
		type: String,
		required: true
	},
	username: {
		type: String,
		validate: {
			isAsync: true,
			validator: function (v, cb) {
				User.findOne({ username: v }, (err, doc) => {
					if (err) return cb(err)

					cb(!doc, "username already exists")
				})
			}
		},
		required: true
	},
	name: {
		type: String,
		required: true
	}
})

var User = mongoose.model('User', userSchema);

module.exports = User;