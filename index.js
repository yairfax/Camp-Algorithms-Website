var express = require('express');
var bodyParser = require('body-parser');
var _ = require("underscore");
var logger = require('morgan');
var exphbs = require('express-handlebars');
var handlebars = exphbs.handlebars;
var app = express();
var PORT = 3000;
var _sessions = require('./sessions/sessions.json')
var utils = require('./utils.js')
var curSesh = {
	prefs: {},
	id: ""
}

//Handlebars stuff
var hbs = exphbs.create({
	helpers: {
		toLowerCase: function(str) {return str.toLowerCase()},
		stringify: JSON.stringify},
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
app.get("/", function(req, res) {
	res.render('home');
})

app.get("/chugim", function(req, res) {
	var session = req.query.session;
	if (!session) return res.render('chug-select', _sessions);

	sessionObj = _.findWhere(_sessions.sessions, {id: session})

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

	if (curSesh.id != session.id) {
		curSesh.prefs = utils.loadCamperPrefs(session.path);
		curSesh.id = session.id;
	}

	curSesh.prefs[req.body.name] = {
		eidah: req.body.eidah,
		bunk: req.body.bunk,
		prefs: [req.body.pref1, req.body.pref2, req.body.pref3]
	}

	utils.writeCamperPrefs(curSesh.prefs, session.path);
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

app.listen(PORT, function() {
	console.log("Server listening on port:", PORT);
})