var express = require('express');
var bodyParser = require('body-parser');
var _ = require("underscore");
var logger = require('morgan');
var exphbs = require('express-handlebars');
var handlebars = exphbs.handlebars;
var app = express();
var PORT = 3000;
var utils = require('./utils.js');
var _sessions = require('./sessions/sessions.json');
var atomic = require('atomic')();
var execFile = require('child_process');
var dotenv = require('dotenv');
var mongoose = require('mongoose');
var Session = require('./models/Session.js');

//MongoDB
dotenv.load()
mongoose.connect(process.env.MONGODB, { useNewUrlParser: true })
mongoose.connection.on('error', function(err) {
	console.log("Connection was unable to take place")
	process.exit(1);
});

//Handlebars stuff
var hbs = exphbs.create({
	helpers: {
		toLowerCase: function(str) {return str.toLowerCase()},
		stringify: JSON.stringify,
		length: _.size,
		titleCase: utils.titleCase},
	defaultLayout: 'main',
	partialsDir: "views/partials/"
})
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');
app.use('/public', express.static('public'));


//Helpers
function formatCamper(obj, session) {
	var prefs = session.campers;

	var ind = prefs.indexOf(_.findWhere(prefs, {name: obj.name}))

	var newObj = {
		name: obj.name,
		gender: obj.gender,
		eidah: obj.eidah,
		bunk: obj.bunk,
		prefs: obj.pref
	}
	
	if (ind != -1) {
		prefs[ind] = newObj
	} else {
		prefs.push(newObj)
	}

	return prefs
}

//Server

//Chugim

app.get("/", function(req, res) {
	res.render('home');
})

app.get("/chugim", function(req, res) {
	Session.find({active: true}, function(err, sessions) {
		var session = req.query.session;
		if (!session) return res.render('chug-select', {sessions: sessions});
		Session.findOne({_id: session, active: true}, function(err, session) {
			if (!session) return res.render('chug-select', sessions);
			res.render('chug-form', {
				eidot: ["Aleph", "Vav", "Bet", "Gimmel", "Daled"],
				bunks: session.bunks,
				chugim: utils.getChugim(session),
				counter: [1, 2, 3],
				session: session,
				repeat: false,
				name: ""
			});
		});
	});
	
});

app.post("/chugim", function(req, res) {
	var id = req.query.session;
	if (!id) return res.send("Please send a session");

	atomic('chug-key', function(done, key) {
		Session.findOne({_id: id, active: true}, function(err, session) {
			if (err) throw err;
			if (!session) return res.send("Please send a valid session id, or session may be inactive.");

			Session.findByIdAndUpdate(id, {$push: {'campers': req.body}}, function(err, data) {
				if (err) throw err;

				res.render('chug-form', {
					eidot: ["Aleph", "Vav", "Bet", "Gimmel", "Daled"],
					bunks: session.bunks,
					chugim: utils.getChugim(session),
					counter: [1, 2, 3],
					session: session,
					repeat: true,
					name: req.body.name
				})

				done();
			});
		});
	});
});

//Rosh Sports Side
app.get("/chugim/klugie", function(req, res) {
	Session.find({}, function(err, sessions) {
		if (err) throw err;
		var sessionID = req.query.session;

		if (!sessionID) return res.render('rosh-sports-select', {sessions: sessions});

		Session.findById(sessionID, function(err, session) {
			if (err) throw err;

			if (!session) return res.render('rosh-sports-select', {sessions: sessions});

			res.render('rosh-sports-main', {
				sessionID: sessionID,
				prefs: session.campers,
				session: session,
				eidot: ["Aleph", "Vav", "Bet", "Gimmel", "Daled"],
				counter: [1, 2, 3],
				chugim: utils.getChugim(session),
				areCampers: !(_.isEmpty(session.campers))
			});
		});

	});
	
});

app.post("/chugim/klugie", function(req, res) {
	var id = req.query.session;
	if (!id) return res.send("Please send a session");

	Session.findById(id, function(err, session) {
		if (err) throw err;
		if (!session) return res.send("Please send a valid session id");

		atomic('chug-key', function(done, key) {
			Session.findOneAndUpdate({_id: id, 'campers.name': req.body.name}, {$set: {
				'campers.$.eidah': req.body.eidah,
				'campers.$.gender': req.body.gender,
				'campers.$.bunk': req.body.bunk,
				'campers.$.prefs': req.body.prefs}}, function(err, data) {
				if (err) throw err;

				res.redirect(`/chugim/klugie?session=${session.id}`)

				done();
			});
		});
	});
	
})

// TODO: STILL IMPLEMENT: CAMPER DELETION
app.delete("/chugim/klugie", function(req, res) {
	var session = req.query.session;
	if (!session) return res.send("Please send a session");
	Session.findByIdAndUpdate(session, {$pull:{campers:{name:req.query.camper}}}, function(err, data) {
		if (!data) return res.send("please send a valid id");
		res.send("Success")
	})
})

//Session creation and deletion
app.delete("/chugim/klugie/newsession", function(req, res) {
	var session = req.query.session;
	if (!session) return res.send("Please send a session");
	Session.findByIdAndDelete(session, function(err, session) {
		if (err) throw err;
		if (!session) return res.send("Please send a valid session id");
		res.send("Success")
	})	
})

app.get("/chugim/klugie/newsession", function(req, res) {
	var eidot = ["Aleph", "Vav", "Bet", "Gimmel", "Daled"]
	var sessionIDs;

	Session.find({}, function(err, data) {
		if (err) throw err;

		sessionIDs = _.pluck(data, '_id')
	
		var id = req.query.session;
		// If no ID passed in.
		if (!id) return res.render('rosh-sports-new', {
			eidot: eidot,
			sessionIDs: sessionIDs
		});

		// If session doesn't exist
		var session = _.findWhere(data, {_id: id});
		if (!session) return res.render('rosh-sports-new', {
			eidot: eidot,
			sessionIDs: sessionIDs
		});

		res.render('rosh-sports-new', {
			eidot: ["Aleph", "Vav", "Bet", "Gimmel", "Daled"],
			session: session,
			chugim: session.klugim,
			editing: true,
			sessionIDs: sessionIDs
		});
	});
});

app.post("/chugim/klugie/newsession", function(req, res) {
	var id = (req.body.year - 2000) + req.body.session;

	var editing = req.body.editing

	
	// Session file writing
	var newSesh = {
		_id: id,
		path: "sessions/" + id + "/",
		name: req.body.year + " " + req.body.session.toUpperCase(),
		year: parseInt(req.body.year),
		session: req.body.session,
		bunks: {
			aleph: req.body.Aleph,
			vav: req.body.Vav,
			bet: req.body.Bet,
			gimmel: req.body.Gimmel,
			daled: req.body.Daled
		},
		active: false
	};

	//Some cleaning
	eidot = _.filter(req.body, function(val, key) {
		return key.includes("eidot");
	});
	eidot = _.map(eidot, function(val, ind) {
		if (typeof val == 'string') {
			return [val]
		}
		else return val;
	})
	eidot = _.map(eidot, function(arr, ind) {
		return _.uniq(_.reduce(arr, function(memo, eidah) {
			if (eidah === "all") {
				return memo.concat(['aleph', 'vav', 'bet', 'gimmel', 'daled']);
			} else if (eidah === "av") {
				return memo.concat(['aleph', 'vav']);
			} else if (eidah === "bgd") {
				return memo.concat(['bet', 'gimmel', 'daled'])
			} else {
				memo.push(eidah);
				return memo
			}
	}, []))});

	name = _.flatten([req.body.name])
	capacity = _.flatten([req.body.capacity])
	popularity = _.flatten([req.body.popularity])


	var klugim_info = []
	for (i in name) {
		klugim_info.push({
			name: name[i],
			capacity: parseInt(capacity[i]),
			popularity: parseFloat(popularity[i]),
			eidot: eidot[i]
		})
	}

	newSesh.klugim = klugim_info

	if (editing && editing !== id) {
		atomic('chug-key', function(done, key) {
			Session.findByIdAndRemove(editing, utils.callbackErr)
			var addSesh = new Session(newSesh)
			addSesh.save(utils.callbackErr)

			done();
		})
	} else if (editing) {
		Session.findByIdAndUpdate(id, newSesh, utils.callbackErr)
	} else {
		var addSesh = new Session(newSesh)
		addSesh.save(utils.callbackErr)
	}

	res.redirect("/chugim/klugie?session=" + id);
})

app.post("/chugim/klugie/activate", function(req, res){
	var id = req.query.session;
	if (!id) return res.send("please send a session id");

	Session.findById(id, function(err, session) {
		if (err) throw err;

		if (!session) return res.send("please send a valid session id");

		Session.findByIdAndUpdate(id, {active: !session.active}, function(err, data) {
			if (err) throw err;

			res.send("Success")
		});
	});
});

app.listen(PORT, function() {
	execFile.execFile("open", ['http://localhost:3000']);
	console.log("Camp algorithms server listening on:", PORT);
})