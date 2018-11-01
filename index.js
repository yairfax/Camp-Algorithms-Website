var express = require('express');
var bodyParser = require('body-parser');
var _ = require("underscore");
var logger = require('morgan');
var exphbs = require('express-handlebars');
var handlebars = exphbs.handlebars;
var app = express();
var PORT = 3000;
var _sessions = require('./sessions/sessions.json');
var utils = require('./utils.js');
var atomic = require('atomic')();
var { execFile } = require('child_process');

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

//Server

//Chugim

//Helper Functions
function writeStuff(obj, session) {
	atomic('chug-key', function(done, key) {
		var prefs = utils.loadCamperPrefs(session.path);

		prefs[obj.name] = {
			eidah: obj.eidah,
			bunk: obj.bunk,
			prefs: [obj.pref1, obj.pref2, obj.pref3]
		}
		utils.writeCamperPrefs(prefs, session.path);
		done();
	})
}

// Requests

app.get("/", function(req, res) {
	res.render('home');
})

app.get("/chugim", function(req, res) {
	var session = req.query.session;
	if (!session) return res.render('chug-select', _sessions);
	var sessionObj = _.findWhere(_sessions.sessions, {id: session})
	if (!sessionObj) return res.render('chug-select', _sessions);

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
	session = _.findWhere(_sessions.sessions, {id: session});
	if (!session) return res.send("Please send a valid session id");

	writeStuff(req.body, session)

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

	writeStuff(req.body, session)

	res.redirect(`/chugim/klugie?session=${session.id}`)
})

app.delete("/chugim/klugie", function(req, res) {
	var session = req.query.session;
	if (!session) return res.send("Please send a session");
	session = _.findWhere(_sessions.sessions, {id: session});
	if (!session) return res.send("Please send a valid session id");

	atomic('chug-key', function(done, key) {
		var prefs = utils.loadCamperPrefs(session.path);

		delete prefs[req.query.camper]
		
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

		execFile('rm', ['-r', session.path]);
		utils.writeSession(_sessions);

		done();
	})

	res.send("Success")
})

app.get("/chugim/klugie/newsession", function(req, res) {
	res.render('rosh-sports-new', {
		eidot: ["Aleph", "Vav", "Bet", "Gimmel", "Daled"]
	});
})

app.post("/chugim/klugie/newsession", function(req, res) {
	var id = (req.body.year - 2000) + req.body.session;

	// TODO: implement where existing session is passed in.

	if (_.findWhere(_sessions, {id: id})) {
		// TODO: implement where id exists already, redirect to that page
	}

	atomic('chug-key', function(done, key) {
		var newSesh = {
			id: id,
			path: "sessions/" + id + "/",
			name: req.body.year + " " + req.body.session.toUpperCase(),
			bunks: {
				aleph: req.body.Aleph,
				vav: req.body.Vav,
				bet: req.body.Bet,
				gimmel: req.body.Gimmel,
				daled: req.body.Daled
			}
		};
		_sessions.sessions.push(newSesh);

		utils.writeSession(_sessions);
		execFile('mkdir', [newSesh.path]);
		
		// TODO: implement chug writing

		done();
	})

	res.redirect("/chugim/klugie?session=" + id);
})

app.listen(PORT, function() {
	execFile("open", ['http://localhost:3000']);
	console.log("Camp algorithms server listening on:", PORT);
})