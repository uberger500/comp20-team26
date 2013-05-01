var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var bcrypt = require('bcrypt');
var models = require('./models.js');

var mongoUri = process.env.MONGOHQ_URL || 'mongodb://heroku:84c7ca002fa6079a82bad84714a0beb7@linus.mongohq.com:10093/app14677217';
mongoose.connect(mongoUri, function(err) {
	if (err) {
		console.log("Error connecting to DB: " + err);
	}
});

var app = express();
app.use(express.logger('dev'));
app.use(express.bodyParser());

// Main Pages

app.get('/', function(request, response) {
	response.send('You\'re totally on a plane. It\'s in the sky. It\'s going fast.');
});

app.get('/secret', function(request, response) {
	response.send('This is a secret.');
});

// Start API endpoints

var API_PREFIX = '/api';

app.all(API_PREFIX + '/*', function(request, response, next) {
	response.get("Access-Control-Allow-Origin", "*");
	response.get("Access-Control-Allow-Headers", "X-Requested-With");

	// Check for token
	if (request.path == API_PREFIX + '/user/login' ||
		request.path == API_PREFIX + '/user/create') {
		next();
	} else {
		models.Session.findOne({token: request.param('token')}, function(err, session) {
			if (err || !session) {
				response.json({success: false, error: 'Session token required for this API call'});
			} else {
				request.session = session;
				next();
			}
		});
	}
});

// User API Endpoints

app.post(API_PREFIX + '/user/create', function(request, response) {
	var pass = request.param('password');
	bcrypt.hash(pass, 10, function(err, hash) {
		models.User.create({
			name : request.param('name'),
			email : request.param('email'),
			password : hash
		}, function(err, user) {
			if (err || !user) {
				response.json({success: false, error: 'Error creating new user'});
			} else {
				response.json({success: true, data: user});
			}
		});
	});
});

app.post(API_PREFIX + '/user/login', function(request, response) {
	var email = request.param('email');
	var pass = request.param('password');
	models.User.findOne({email: email}, function(err, user) {
		if (err || !user) {
			response.json({success: false, error: 'That user does not exist'});
		} else {
			bcrypt.compare(pass, user.password, function(err, match) {
				if (err || !match) {
					response.json({success: false, error: 'Incorrect password for user ' + user.email});
				} else {
					models.Session.findOne({user: user.id}, function(err, session) {
						if (err || !session) {
							models.Session.create({user: user.id,
								token: models.UUID()}, function(err, session) {
									if (err || !session) {
										response.json({success: false, error: 'Could not create token'});
									} else {
										response.json({success: true, data: session.token});
									}
							});
						} else {
							response.json({success: true, user: user, token: session.token});
						}
					});
				}
			});
		}
	});
});

app.post(API_PREFIX + '/user/logout', function(request, response) {
	var token = request.session.token;
	models.Session.findOneAndRemove({token: token}, function(err, session) {
		if (err || !session) {
			response.json({success: false, error: 'Invalid session token'});
		} else {
			response.json({success: true});
		}
	});
});

app.post(API_PREFIX + '/user/delete', function(request, response) {
	var user_id = request.session.user;
	models.User.findById(user_id, function(err, user) {
		if (err || !user) {
			response.json({success: false, error: 'User not found for deletion'});
		} else {
			models.Session.remove({user: user_id}).exec();
			response.json({success: true});
		}
	});
});

app.post(API_PREFIX + '/user/addflight', function(request, response) {
	var flight = request.param('flight');
	var user_id = request.session.user;
	models.User.findByIdAndUpdate(user_id, {$addToSet: {flight_numbers: flight}}, function(err, user) {
		if (err || !user) {
			response.json({success: false, error: 'Error saving user data'});
		} else {
			response.json({success: true});
		}
	});
});

app.post(API_PREFIX + '/user/update', function(request, response) {
	var user_id = request.session.user;
	models.User.findById(user_id, function(err, user) {
		var properties = ['total_flights', 'total_miles', 'average_speed', 'average_altitude', 'number_of_states'];
		for (var i = 0; i < properties.length; i++) {
			var new_val = request.param(properties[i]);
			if (new_val) {
				user[properties[i]] = new_val;
			}
		}
		user.save(function(err) {
			if (err) {
				response.json({success: false, error: 'Error saving user data'});
			} else {
				response.json({success: true});
			}
		});
	});
});

var port = process.env.PORT || 5000;
app.listen(port, function() {
	console.log("Listening on " + port);
});