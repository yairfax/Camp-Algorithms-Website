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
var curSesh = {
	prefs: {},
	id: ""
}

app.get("/", function(req, res) {
	res.render('home');
})

app.get("/chugim", function(req, res) {
	var session = req.query.session;
	if (!session) return res.render('chug-select', _sessions);

	var sessionObj = _.findWhere(_sessions.sessions, {id: session})

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
	if (!session) res.send("Please send a valid session id");

	atomic('chug-key', function(done, key) {
		curSesh.prefs = utils.loadCamperPrefs(session.path);
		curSesh.id = session.id;

		curSesh.prefs[req.body.name] = {
			eidah: req.body.eidah,
			bunk: req.body.bunk,
			prefs: [req.body.pref1, req.body.pref2, req.body.pref3]
		}
		utils.writeCamperPrefs(curSesh.prefs, session.path);
		done();
	})

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

	res.render('rosh-sports', {
		sessionID: sessionID,
		prefs: utils.loadCamperPrefs(session.path),
		session: session
	})
})

app.listen(PORT, function() {
	console.log("Server listening on port:", PORT);
})