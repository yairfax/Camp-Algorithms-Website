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
function writeCamper(obj, session) {
	atomic('chug-key', function(done, key) {
		var prefs = utils.loadCamperPrefs(session.path);

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

		utils.writeCamperPrefs(prefs, session.path);
		done();
	})
}

//Server

//Chugim

app.get("/", function(req, res) {
	res.render('home');
})

app.get("/chugim", function(req, res) {
	var session = req.query.session;
	var sessions = {
		sessions: _.where(_sessions.sessions, {active: true})
	}
	if (!session) return res.render('chug-select', sessions);
	var sessionObj = _.findWhere(_sessions.sessions, {id: session, active: true})
	if (!sessionObj) return res.render('chug-select', sessions);

	res.render('chug-form', {
		eidot: ["Aleph", "Vav", "Bet", "Gimmel", "Daled"],
		bunks: sessionObj.bunks,
		chugim: utils.getChugim(sessionObj.path),
		counter: [1, 2, 3],
		session: sessionObj,
		repeat: false,
		name: ""
	})
})

app.post("/chugim", function(req, res) {
	var session = req.query.session;
	if (!session) return res.send("Please send a session");
	session = _.findWhere(_sessions.sessions, {id: session, active: true});
	if (!session) return res.send("Please send a valid session id, or session may be inactive.");

	writeCamper(req.body, session)

	res.render('chug-form', {
		eidot: ["Aleph", "Vav", "Bet", "Gimmel", "Daled"],
		bunks: session.bunks,
		chugim: utils.getChugim(session.path),
		counter: [1, 2, 3],
		session: session,
		repeat: true,
		name: req.body.name
	})
})

//Rosh Sports Side
app.get("/chugim/klugie", function(req, res) {
	var sessionID = req.query.session;
	if (!sessionID) return res.render('rosh-sports-select', _sessions);
	var session = _.findWhere(_sessions.sessions, {id: sessionID})
	if (!session) return res.render('rosh-sports-select', _sessions);

	var prefs = utils.loadCamperPrefs(session.path)

	res.render('rosh-sports-main', {
		sessionID: sessionID,
		prefs: prefs,
		session: session,
		eidot: ["Aleph", "Vav", "Bet", "Gimmel", "Daled"],
		counter: [1, 2, 3],
		chugim: utils.getChugim(session.path),
		areCampers: !(_.isEmpty(prefs))
	})
})

app.post("/chugim/klugie", function(req, res) {
	var session = req.query.session;
	if (!session) return res.send("Please send a session");
	session = _.findWhere(_sessions.sessions, {id: session});
	if (!session) return res.send("Please send a valid session id");

	writeCamper(req.body, session)

	res.redirect(`/chugim/klugie?session=${session.id}`)
})

app.delete("/chugim/klugie", function(req, res) {
	var session = req.query.session;
	if (!session) return res.send("Please send a session");
	session = _.findWhere(_sessions.sessions, {id: session});
	if (!session) return res.send("Please send a valid session id");

	atomic('chug-key', function(done, key) {
		var prefs = utils.loadCamperPrefs(session.path);

		prefs = _.reject(prefs, function(elt) {
			return elt.name === req.query.camper
		})
		
		utils.writeCamperPrefs(prefs, session.path);
		done();
	})
	res.send("Success")
})

//Session creation and deletion
app.delete("/chugim/klugie/newsession", function(req, res) {
	var session = req.query.session;
	if (!session) return res.send("Please send a session");
	session = _.findWhere(_sessions.sessions, {id: session});
	if (!session) return res.send("Please send a valid session id");

	atomic('chug-key', function(done, key) {
		_sessions.sessions = _.reject(_sessions.sessions, function(ent) {
			return ent.id == session.id
		})

		execFile.execFile('rm', ['-r', session.path]);
		utils.writeSession(_sessions);

		done();
	})

	res.send("Success")
})

app.get("/chugim/klugie/newsession", function(req, res) {
	var eidot = ["Aleph", "Vav", "Bet", "Gimmel", "Daled"]
	var sessionIDs = _.pluck(_sessions.sessions, 'id')

	var id = req.query.session;
	// If no ID passed in.
	if (!id) return res.render('rosh-sports-new', {
		eidot: eidot,
		sessionIDs: sessionIDs
	});
	// If session doesn't exist
	var session = _.findWhere(_sessions.sessions, {id: id});
	if (!session) return res.render('rosh-sports-new', {
		eidot: eidot,
		sessionIDs: sessionIDs
	});

	res.render('rosh-sports-new', {
		eidot: ["Aleph", "Vav", "Bet", "Gimmel", "Daled"],
		session: session,
		chugim: utils.getFullChugim(session.path),
		editing: true,
		sessionIDs: sessionIDs
	})
})

app.post("/chugim/klugie/newsession", function(req, res) {
	var id = (req.body.year - 2000) + req.body.session;

	var editing = req.body.editing

	if (_.findWhere(_sessions.sessions, {id: id}) && !(editing)) {
		return res.send("Session exists already, please go back");
	}

	atomic('chug-key', function(done, key) {

		if (editing) {
			_sessions.sessions = _.reject(_sessions.sessions, function(sesh) {
				return sesh.id === editing;
			})
		}

		// Session file writing
		var newSesh = {
			id: id,
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

		_sessions.sessions.push(newSesh);

		if (!editing) {
			//Session directory creation
			execFile.execFileSync('mkdir', [newSesh.path]);
		} else if (editing != id) {
			execFile.execFileSync('mv', [`sessions/${editing}`, `sessions/${id}`])
		}

		utils.writeSession(_sessions);


		//klugim-info.json creation
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

		utils.writeChugData(klugim_info, newSesh.path);

		done();
	})

	res.redirect("/chugim/klugie?session=" + id);
})

app.post("/chugim/klugie/activate", function(req, res){
	var id = req.query.session;
	if (!id) return res.send("please send a session id");
	var session = _.findWhere(_sessions.sessions, {id: id});
	if (!session) return res.send("please send a valid session id");

	atomic("chug-key", function(done, key) {
		session.active = !session.active;

		utils.writeSession(_sessions);

		done();
	})

	res.send("Success")
})

app.listen(PORT, function() {
	execFile.execFile("open", ['http://localhost:3000']);
	console.log("Camp algorithms server listening on:", PORT);
})