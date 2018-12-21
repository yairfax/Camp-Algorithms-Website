var mongoose = require('mongoose')

var userSchema = new mongoose.Schema({
	pswd: {
		type: String,
		required: true
	}, 
	username: {
		type: String,
		required: true
	},
	name: {
		type: String,
		required: true
	}
})

var User = mongoose.model('User', userSchema);

module.exports = User;