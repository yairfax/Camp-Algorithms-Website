var express = require('express');
var bodyParser = require('body-parser');
var _ = require("underscore");
var logger = require('morgan');
var exphbs = require('express-handlebars');
var app = express();
var PORT = 3000;
var utils = require('./utils.js');
var dotenv = require('dotenv');
var mongoose = require('mongoose');
var Session = require('./models/Session.js');
var expstate = require('express-state');
var passport = require('passport');
var Strategy = require('passport-local').Strategy;
var ensureLogin = require('connect-ensure-login');
var expsession = require('express-session');
var saltRounds = 10;
var bcrypt = require('bcrypt');
var User = require('./models/User.js');
var driver = require('./driver');
var createCSVStringifier = require('csv-writer').createObjectCsvStringifier;
var createArrayCSVStringifier = require('csv-writer').createArrayCsvStringifier;

//MongoDB
dotenv.load()
mongoose.connect(process.env.MONGODB, { useNewUrlParser: true })
mongoose.connection.on('error', function(err) {
	console.log("Connection to database was unable to take place")
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
app.use(expsession({ secret: 'keyboard cat', resave: false, saveUninitialized: false }));
const lowerEidot = ['aleph', 'vav', 'bet', 'gimmel', 'daled'];
const upperEidot = _.map(lowerEidot, utils.titleCase)

// Set up express-state
expstate.extend(app);
app.set("state namespace", 'ctxt'); 

// Set up passport
passport.use(new Strategy(function(username, password, cb) {
	User.findOne({username: username}, function(err, user) {
		if (err) return cb(err);
		if (!user) return cb(null, false);
		bcrypt.compare(password, user.pswd, function(err, res) {
			if (err) return cb(err);
			if (!res) return cb(null, false);
			else return cb(null, user);
		})
	})
}));

passport.serializeUser(function(user, cb) {
	cb(null, user._id);
});

passport.deserializeUser(function(id, cb) {
	User.findById(id, function(err, user) {
		if (err) return cb(err);
		cb(null, user);
	})
});

app.use(passport.initialize());
app.use(passport.session());

//Server

//Chugim

app.get("/", function(req, res) {
	res.render('home');
});

// Login
app.get('/login', function(req, res) {
	if (req.user) {
		return res.redirect('/')
	}
	res.render('login', {
		fail: req.query.fail === 'true'
	})
})

app.post('/login', passport.authenticate('local', {failureRedirect: '/login?fail=true'}), function(req, res) {
	res.redirect('/chugim/klugie')
})

app.get('/logout', function(req, res) {
	req.logout();
	res.redirect('/login');
})

//Session creation and deletion
app.delete("/chugim/klugie/:id/delete", ensureLogin.ensureLoggedIn(), function(req, res) {
	var session = req.params.id;

	Session.findByIdAndDelete(session, function(err, session) {
		if (err) throw err;
		if (!session) return res.send("Please send a valid session id");
		res.send("Success");
	});
});

app.get("/chugim/klugie/newsession", ensureLogin.ensureLoggedIn(), function(req, res) {
	Session.find({}, function(err, data) {
		if (err) throw err;
	
		res.expose(_.pluck(data, '_id'), "sessionIDs");
		res.render('rosh-sports-new', {
			eidot: upperEidot
		});
	});
});

app.get("/chugim/klugie/:id/editsession", ensureLogin.ensureLoggedIn(), function(req, res) {
	Session.find({}, function(err, data) {
		if (err) throw err;
		Session.findById(req.params.id, function(err, session) {
			if (err) throw err;
			if (!session) return res.redirect('/chugim/klugie/newsession');

			res.expose(_.pluck(data, '_id'), "sessionIDs")
			res.expose(true, "editing");
			res.expose(session, "session");
			res.expose(upperEidot, "eidot");
			res.expose(session.klugim, "chugim");
			res.render('rosh-sports-new', {
				eidot: upperEidot
			});
		});
	});
});

app.post("/chugim/klugie/newsession", ensureLogin.ensureLoggedIn(), async function(req, res) {
	var id = (req.body.year - 2000) + req.body.session;

	var editing = req.body.editing

	// Session file writing
	var newSesh = {
		_id: id,
		name: req.body.year + " " + req.body.session.toUpperCase(),
		year: parseInt(req.body.year),
		session: req.body.session,
		bunks: {
			aleph: req.body.Aleph,
			vav: req.body.Vav,
			bet: req.body.Bet,
			gimmel: req.body.Gimmel,
			daled: req.body.Daled
		}
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
		await Session.findByIdAndRemove(editing, function(err, data) {
			if (err) throw err;
			newSesh.campers = data.campers;
			newSesh.active = data.active;
			// AD KAN -- carry over old session data
			addSesh = new Session(newSesh);
			addSesh.save(utils.callbackErr);
		})
	} else if (editing) {
		await Session.findByIdAndUpdate(id, newSesh, utils.callbackErr)
	} else {
		newSesh.active = false;
		var addSesh = new Session(newSesh)
		addSesh.save(utils.callbackErr)
	}

	res.redirect("/chugim/klugie/" + id);
})

app.post("/chugim/klugie/:id/activate", ensureLogin.ensureLoggedIn(), function(req, res){
	var id = req.params.id;
	Session.findById(id, function(err, session) {
		if (err) throw err;

		Session.findByIdAndUpdate(id, {active: !session.active}, function(err, data) {
			if (err) throw err;
			if (!data) return res.send("Please send a valid session ID");

			res.send("Success")
		});
	})
	
});

//Rosh Sports Side
app.get("/chugim/klugie", ensureLogin.ensureLoggedIn(), function(req, res) {
	Session.find({}, function(err, sessions) {
		if (err) throw err;
		
		res.render('rosh-sports-select', {sessions: sessions, user: req.user.name});
	});
});

app.get("/chugim/klugie/:id", ensureLogin.ensureLoggedIn(), function(req, res) {
	var sessionID = req.params.id;

	Session.findById(sessionID, function(err, session) {
		if (err) throw err;
		if (!session) return res.redirect('/chugim/klugie');

		res.expose(session, "session");
		res.expose(utils.getChugim(session), "chugim");
		res.expose(sessionID, "sessionID");
		res.render('rosh-sports-main', {
			sessionID: sessionID,
			prefs: _.sortBy(session.campers, function(elt) {
				return lowerEidot.indexOf(elt.eidah) + elt.gender + elt.bunk + elt.name.split(/ +/)[1]
			}),
			session: session,
			eidot: upperEidot,
			counter: [1, 2, 3],
			areCampers: !(_.isEmpty(session.campers))
		});
	});
});

app.post("/chugim/klugie/:id", ensureLogin.ensureLoggedIn(), function(req, res) {
	var id = req.params.id;

	var update = {'campers.$.eidah': req.body.eidah,
		'campers.$.gender': req.body.gender,
		'campers.$.bunk': req.body.bunk,
		'campers.$.prefs': req.body.prefs}

	if (req.body.chug) {
		update['campers.$.chug'] = req.body.chug;
	}

	Session.findOneAndUpdate({_id: id, 'campers.name': req.body.name}, {$set: update, $pull:{noChug:{name:req.body.name}}}, {select: {'campers.$': 1, _id: 0, tears: 1, noChug: 1}}, function(err, data) {
		if (err) throw err;

		if (!data) return res.send("Please send valid session ID");

		if (req.body.chug) {
			if (!data.campers[0].chug) { // case of kid you're editing didn't have a chug
				data.tears[3] -= 1;
			}

			if (data.campers[0].prefs.includes(data.campers[0].chug)) { // case of chug you're taking kid out of was in prefs
				data.tears[_.indexOf(data.campers[0].prefs, data.campers[0].chug)] -= 1;
			}

			if (data.campers[0].prefs.includes(req.body.chug)) { // case of chug you're putting the kid in is in prefs
				data.tears[_.indexOf(data.campers[0].prefs, req.body.chug)] += 1;
			}

			// original chug
			Session.findOneAndUpdate({_id: id, 'klugim.name': data.campers[0].chug}, {$pull:{'klugim.$.kids':{name:req.body.name}}}, {select: {'klugim.$': 1, _id: 0}}, function(err, oldChug) {
				//this is the chreft I get for maintaining two data structures
				if (err) throw err;

				if (data.campers[0].chug && !oldChug) return res.send("Please send valid session ID");
				data.campers[0].chug = req.body.chug
				// new chug
				Session.findOneAndUpdate({_id: id, 'klugim.name': req.body.chug}, {tears: data.tears, $push:{'klugim.$.kids':data.campers[0]}}, {select: {'klugim.$': 1, _id: 0}}, (err, newChug) => {
					if (err) throw err;

					if (!newChug) return res.send("Please send valid session ID");
					res.redirect(`/chugim/klugie/${id}`);
				});
			});
		} else {
			res.redirect(`/chugim/klugie/${id}`);
		}

	});
	
});

app.delete("/chugim/klugie/:id", ensureLogin.ensureLoggedIn(), function(req, res) {
	var session = req.params.id;
	Session.findOneAndUpdate({_id: session, 'campers.name': req.query.camper}, {$pull:{campers:{name:req.query.camper}}}, {select: {'campers.$': 1, _id: 0}}, function(err, data) {
		if (err) throw err;
		if (!data) return res.send("please send a valid id");

		Session.findOneAndUpdate({_id: session, 'klugim.name': data.campers[0].chug}, {$pull:{'klugim.$.kids':{name:req.query.camper}}}, function(err, data) {
			if (err) throw err;
			if (!data) return res.send("please send a valid id");

			res.send("Success");
		})
	});
});

// Chug list production
app.post("/chugim/klugie/:id/producelist", ensureLogin.ensureLoggedIn(), function(req, res) {
	Session.findById(req.params.id, function(err, session) {
		if (err) throw err;
		if (!session) return res.send("Please send a session!");

		// getList updates in place
		var outData = driver.getList(session.campers, session.klugim);

		session.noChug = outData.noChug;
		session.tears = outData.tears;
		session.lastProduction = new Date();

		Session.findByIdAndUpdate(req.params.id, session, function(err, session) {
			res.send('Success');
		})
	})
})

app.get("/chugim/klugie/:id/chuglist", ensureLogin.ensureLoggedIn(), function(req, res) {
	Session.findById(req.params.id, function(err, session) {
		if (err) throw err;
		if (!session) return res.send('Please send valid session ID');

		var tempChugim = _.map(session.klugim, function(val) {
			console.log(val)
			var kids = _.map(val.kids, (kid) => {return kid.name})
			return [val.name].concat(kids)
		})
		tempChugim.push(['No Chug'].concat(_.pluck(session.noChug, 'name')))

		var chugCSV = createArrayCSVStringifier({});
		var csvString = chugCSV.stringifyRecords(tempChugim);

		res.set({"Content-Disposition":`attachment; filename="Chug List ${session.name}.csv"; `});
		res.set({"Content-Type":"text/csv"})
		res.send(csvString);
	})
})

app.get("/chugim/klugie/:id/camperlist", ensureLogin.ensureLoggedIn(), function(req, res) {
	Session.findById(req.params.id, function(err, session) {
		if (err) throw err;
		if (!session) return res.send('Please send valid session ID');

		var tempCampers = _.sortBy(_.map(session.campers, function(kid) {
			return {name: kid.name, eidah: utils.titleCase(kid.eidah), gender: utils.titleCase(kid.gender),
				bunk: kid.bunk, pref1: kid.prefs[0], pref2: kid.prefs[1], pref3: kid.prefs[2],
				pref_recieved: kid.pref_recieved, chug: kid.chug};
		}), function(elt) {
			return upperEidot.indexOf(elt.eidah) + elt.gender + elt.bunk + elt.name.split(/ +/)[1]; 
		});

		var camperCSV = createCSVStringifier({
		    header: [
		        {id: 'name', title: 'Name'},
		        {id: 'eidah', title: 'Eidah'},
		        {id: 'gender', title: 'Gender'},
		        {id: 'bunk', title: 'Bunk'},
		        {id: 'pref1', title: 'First Preference'},
		        {id: 'pref2', title: 'Second Preference'},
		        {id: 'pref3', title: 'Third Preference'},
		        {id: 'pref_recieved', title: 'Preference Recieved'},
		        {id: 'chug', title: 'Chug'}
		    ]
		});

		csvString = camperCSV.getHeaderString() + camperCSV.stringifyRecords(tempCampers);

		res.set({"Content-Disposition":`attachment; filename="Camper List ${session.name}.csv"; `});
		res.set({"Content-Type":"text/csv"})
		res.send(csvString);
	})
})

// Regular Chug form
function renderChugPage(repeat, req, res) {
	Session.findOne({_id: req.params.id, active: true}, function(err, session) {
		if (!session) return res.redirect('/chugim');

		res.expose(session.bunks, "bunks");
		res.expose(utils.getChugim(session), "chugim");
		res.expose(session, "session");
		res.render('chug-form', {
			eidot: upperEidot,
			counter: [1, 2, 3],
			session: session,
			repeat: repeat,
			name: req.body.name
		});
	});
}

app.get("/chugim", function(req, res) {
	Session.find({active: true}, function(err, sessions) {
		if (err) throw err;

		res.render('chug-select', {sessions: sessions})
	});
});

app.get("/chugim/:id", function(req, res) {
	renderChugPage(false, req, res);
});

app.post("/chugim/:id", function(req, res) {
	Session.findOne({_id: req.params.id, active: true, 'campers.name': req.body.name}, function(err, session) {
		if (err) throw err;

		if (!session) {
			Session.findOneAndUpdate({_id: req.params.id, active: true}, {$push: {'campers': req.body}}, function(err, data) {
				if (err) throw err;

				renderChugPage(true, req, res)
			});
		} else {
			renderChugPage(false, req, res);
		}
	})
	
});

// Other user registration
app.get('/register', ensureLogin.ensureLoggedIn(), function(req, res) {
	User.find({}, function(err, users) {
		if (err) throw err;

		res.expose(_.pluck(users, 'username'), 'users');
		res.render('register');
	})
	
})

app.post('/register', ensureLogin.ensureLoggedIn(), function(req, res) {
	bcrypt.hash(req.body.pswd, saltRounds, function(err, hash) {
		var newUser = new User({
			name: req.body.name,
			username: req.body.username,
			pswd: hash
		});
		newUser.save();
		res.redirect('/chugim/klugie')
	});
});

// Change Password
app.post('/changepassword', ensureLogin.ensureLoggedIn(), function(req, res) {
	bcrypt.hash(req.body.pswd, saltRounds, function(err, hash) {
		User.findOneAndUpdate({username: req.user.username}, {pswd: hash}, function(data) {
			res.redirect('/chugim/klugie')
		});
	});
});

// API
app.get('/api/chugim/:id/campers', function(req, res) {
	var id = req.params.id;

	Session.findById(id, function(err, session) {
		if (err) throw err;

		if (!session) return res.send("please send a valid session id");
		return res.json(session.campers);
	});
});

app.get('/api/ispassword', ensureLogin.ensureLoggedIn(), function(req, res) {
	var pswd = req.query.pswd;
	if (!pswd) return res.send("Please send a password!");

	bcrypt.compare(pswd, req.user.pswd, function(err, ress) {
		if (err) throw err;

		res.json(ress)
	});
});

// Handle 404
app.use(function(req, res) {
	res.status(404)
	res.render('404');
});

app.listen(process.env.PORT || PORT, function() {
    console.log('Listening!');
});