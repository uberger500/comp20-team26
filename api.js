var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var bcrypt = require('bcrypt');
var fs = require('fs');
var models = require('./models.js');

var db = null;
var mongoUri = process.env.MONGOHQ_URL || 'mongodb://heroku:84c7ca002fa6079a82bad84714a0beb7@linus.mongohq.com:10093/app14677217';
mongoose.connect(mongoUri, function(err) {
	if (err) {
		console.log("Error connecting to DB: " + err);
	} else {
		db = mongoose.connection.db;
	}
});

var app = express();
app.use(express.logger('dev'));
app.use(express.bodyParser());



var db2 = mongo.Db.connect(mongoUri, function (error, databaseConnection) {
	db2 = databaseConnection;
});


// Main Pages

app.get(/(.+)\.(.+)/, function(request, response, next) {
	var path = request.path;
	if (path == '/') {
		path = '/index.html';
	}
	if (path) {
		response.sendfile('./www' + path);
	} else {
		next();
	}
});

app.get('/', function(request, response, next) {
	response.sendfile('./www/index.html');
});

// Start API endpoints

var API_PREFIX = '/api'; // Used so we don't accidentally get static resources (HTML, css, js, etc.)

app.all(API_PREFIX + '/*', function(request, response, next) {
	response.header("Access-Control-Allow-Origin", "*");
	response.header("Access-Control-Allow-Headers", "X-Requested-With");

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
	var name = request.param('name');
	var email = request.param('email');
	if (!pass || !name || !email) {
		response.json({success: false, error: 'Invalid input'});
		return;
	}
	console.log("Email: " + email);
	console.log("Pass: " + pass);
	bcrypt.hash(pass, 10, function(err, hash) {
		if (err || !hash) {
			response.json({success: false, error: 'Password could not be hashed'});
		} else {
			models.User.create({
				name : name,
				email : email,
				password : hash
			}, function(err, user) {
				if (err || !user) {
					response.json({success: false, error: 'Error creating new user'});
				} else {
					response.json({success: true, user: user});
				}
			});
		}
	});
});

app.post(API_PREFIX + '/user/login', function(request, response) {
	var pass = request.param('password');
	var email = request.param('email');
	if (!pass || !email) {
		response.json({success: false, error: 'Invalid input'});
		return;
	}
	models.User.findOne({email: email}, function(err, user) {
		if (err || !user) {
			response.json({success: false, error: 'That user does not exist'});
		} else {
			bcrypt.compare(pass, user.password, function(err, match) {
				if (err || !match) {
					response.json({success: false, error: 'Incorrect password for user ' + user.email + " error: " + err});
				} else {
					models.Session.findOne({user: user.id}, function(err, session) {
						if (err || !session) {
							models.Session.create({user: user.id,
								token: models.UUID()}, function(err, session) {
									if (err || !session) {
										response.json({success: false, error: 'Could not create token'});
									} else {
										response.json({success: true, user: user, token: session.token});
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
	
//	var doc = userSchema.flightSchema.id(id);
//	console.log(doc)

	var flightdb = db2.collection('flights');


//First insert new flight into flights collection	
	flightdb.insert({name: flight}, {safe:true}, function(err, objects) {
		if (err) console.warn(err.message);
		if (err && err.message.indexOf('E11000 ') !== -1) {
		  // this _id was already inserted in the database
		}
		newflightid = objects[0]._id;
		
//then add ID of new flight	into users collection for the logged in user
		var users = db2.collection('users');
		users.update({'_id' : user_id}, {$addToSet: {flightids:{name:flight, id:newflightid}}}, {safe:true}, function(err) {
			
		});

	});	

//EXTRA?
	models.User.findByIdAndUpdate(user_id, {$addToSet: {flights: flight}}, function(err, user) {
//		console.log("adding " + flight);
		if (err || !user) {
			console.log("add flight fail");
			response.json({success: false, error: 'Error saving user data'});
		} else {
//			console.log("add flight success");
			response.json({success: true});
		}
	});
//^^EXTRA?
	
});

// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = 

//add coordinates etc data to db
app.post(API_PREFIX + '/user/update', function(request, response) {
	var user_id = request.session.user;
	var flight = request.param('flight');
	var users = db2.collection('users');
	var flights = db2.collection('flights');
	response.set('Content-Type', 'text/json');

	var time = request.param('time');
	if (time != undefined && time.indexOf(':') != -1 && time.indexOf('EDT') != -1 && time.indexOf('Current information') != -1){
		var pm = false;
		time = request.param('time');

		time = time.replace("Current information (", "").replace(" EDT)", "");
		if (time.indexOf("pm") != -1){
			pm = true;
		}
		time = time.replace(" pm", "").replace(" am", "");
		datearray = time.split(':');
		var hour = parseInt(datearray[0]);
		if (hour < 12 && pm == true){
			hour = hour + 12;
		}
		hour = hour.toString();
		if (hour == 12 && pm == false){
			hour = "00";
		}	
		time = hour + ":" + datearray[1] + ":00";
	}
	else{
		time = undefined;
	}
//first take flight name and figure out the objectID assigned to the user for that flight
	users.findOne({'_id' : user_id}, {flightids : 1}, function (err, doc){
		if (doc != null){			
			var idfound = "";
			//search all their flights for the correct id
			for (var i = 0; i < doc.flightids.length; i++){
				if (doc.flightids[i].name == flight){
					idfound = doc.flightids[i].id;
				}
			}
// then add coordinates to that object ID			
			if (idfound != ""){
				if (request.param('latitude') != undefined && request.param('longitude') != undefined){
					var newlat = request.param('latitude');
					var newlon = request.param('longitude');
			  			flights.update({'_id' : idfound}, {$addToSet: {latitudes:newlat, longitudes:newlon, coordinates:[time, newlat, newlon]}}, {safe:true}, function(err) {
							if (err) console.warn(err.message);
						});					
				}
				else{
					console.log("params not found");
				}
			}
		}
		response.send({status:"finished"});
	});
	response.send({status:"finished"});
});

// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = 

app.get(API_PREFIX + '/user/pathcoords', function(request, response) {
	var user_id = request.session.user;
	var flight = request.param('flight');
	var users = db2.collection('users');
	var flights = db2.collection('flights');
	response.set('Content-Type', 'text/json');

//first take flight name and figure out the objectID assigned to the user for that flight
	users.findOne({'_id' : user_id}, {flightids : 1}, function (err, doc){
		if (doc != null){			
			var idfound = "";
			//search all their flights for the correct id
			for (var i = 0; i < doc.flightids.length; i++){
				if (doc.flightids[i].name == flight){
					idfound = doc.flightids[i].id;
				}
			}
// then grab all the coordinates from that flight ID
			if (idfound != ""){
//				console.log("searching for coords plane key " + idfound);
				flights.find({'_id' : idfound}, {coordinates:1}).toArray(function (err, doc){
					if (doc != null){
					
						//remove times leaving just coordinates?
						//put in order of times then respond with the correct path w/o times
						// DONT ADD TO FINAL ARRAY IF ALREADY COORDS WITH SAME TIME MINS
						
						timecoordsarray = doc[0].coordinates;
						finalpath = new Array();
						
						if (timecoordsarray != undefined){	
							// sort by time
							timecoordsarray = timecoordsarray.sort(comparator);
							
							var usedtimes = new Array();
							
							//for all sets of times/coordinates for the flight...
							for (var i = 0; i < timecoordsarray.length; i++){
								//if there are no coordinates in finalpath array for the given time of this datum...
								if (usedtimes.indexOf(timecoordsarray[i][0]) == -1){
									//add the coordinates to the finalpath array of just coordinates, no times
									var newarray = new Array();
									newarray.push(timecoordsarray[i][1]); //push lat
									newarray.push(timecoordsarray[i][2]); //push lon
									finalpath.push(newarray); //push coords to final array
								}
							}
						}
//						console.log("FINAL PATH TO RETURN...");
//						console.dir(finalpath);
						response.send(finalpath); //pass ordered-by-time & non-duplicates-by-time array of [lat, lon]'s			
					}
				});
			}

		}
	});
});

function comparator(a,b){
	if (a[0] < b[0]){
		return -1;
	}
	if (a[0] > b[0]){
		return 1;
	}
	return 0;
}

/*
		var properties = ['total_flights', 'total_miles', 'average_speed', 'average_altitude', 'number_of_states'];
		for (var i = 0; i < properties.length; i++) {
			var prop = properties[i];
			var new_val = request.param(prop);
			if (new_val) {
				user[prop] = new_val;
			}
			if (prop == 'average_speed') {
				user.all_speeds.push(new_val);
			}
			if (prop == 'average_altitude') {
				user.all_altitudes.push(new_val);
			}
		}



		var users = db2.collection('users');
		users.find({'_id' : user_id}, {limit:2}).toArray(function (err, doc){
			if (doc != null){
				console.dir(doc);

				var flightpluses = request.param('flight').replace(/ /g, "+");

			  	users.update({'_id' : user_id}, {$addToSet: {latitudes:9001}}, {safe:true}, function(err) {
						if (err) console.warn(err.message);
						else console.log('successfully updated');
			  	});

			  	users.update({'_id' : user_id}, {$addToSet: {flightlist:flightpluses}}, {safe:true}, function(err) {
						if (err) console.warn(err.message);
						else console.log('successfully updated');
			  	});
			  	

			  	users.update({'_id' : user_id}, {$addToSet: {flightpluses:1}}, {safe:true}, function(err) {
						if (err) console.warn(err.message);
						else console.log('successfully updated');
			  	});

			  	
			}
		});

	models.User.findById(user_id, function(err, user) {

		
		if (request.param('latitude') != undefined && request.param('longitude') != undefined){
			console.log("adding new lat long " + request.param('latitude') + " " + request.param('longitude'));

			var newlat = request.param('latitude');
			var newlon = request.param('longitude');
		

			models.User.findByIdAndUpdate(user_id, {$addToSet: {latitudes: newlat, longitudes: newlon}}, function(err, user) {
				if (err || !user) {
					console.log("couldnt add just latlon");
					response.json({success: false, error: 'Error saving user data'});
				} else {
					console.log("added latlon");
					response.json({success: true});
				}
			});

			var newcoords = new Array;
			newcoords.push(request.param('latitude'));
			newcoords.push(request.param('longitude'));
			models.User.findByIdAndUpdate(user_id, {$addToSet: {flightdata: newcoords}}, function(err, user) {
				if (err || !user) {
					console.log("couldnt add both");
					response.json({success: false, error: 'Error saving user data'});
				} else {
					console.log("added both");
					response.json({success: true});
				}
			});
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
*/

// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = 

app.post(API_PREFIX + '/score/submit', function(request, response) {
	var user_id = request.session.user;
	models.User.findById(user_id, function(err, user) {
		if (err || !user) {
			response.json({success: false, error: "User could not be found"});
		} else {
			models.Score.create({
				user: user_id,
				game_title: request.param('game_title'),
				score: request.param('score')}, function(err, score) {
				if (err || !score) {
					response.json({success: false, error: "Score could not be saved"});
				} else {
					response.json({success: true});
				}
			});
		}
	});
});

// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = 

app.get(API_PREFIX + '/score', function(request, response) {
	models.Score.find({user: request.session.user}, function(err, scores) {
		if (err) {
			response.json({success: false, error: "Scores could not be found for the user"});
		} else {
			response.json({success: true, data: scores});
		}
	});
});

// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = 

//CHAT FILES
app.post(API_PREFIX + '/chat/submit', function(request, response) {
	var user_id = request.session.user;
	models.User.findById(user_id, function(err, user) {
		if (err || !user) {
			response.send("User not found");
		} else {
			db.collection('chat', function(err, collection) {
				collection.insert({username: user.name, chatline: request.body.chatline}, {safe:true}, function(err, result) {
			          if (err) {
			              response.send({'error':'An error has occured'});
			          } else {
			            collection.find().toArray(function(err, items){
			            response.send(result[0]);
					});
			       }
				});
			});
		}
	});
});

// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = 


app.get(API_PREFIX + '/chat/chatlines', function(request, response) {
    db.collection('chat', function(err, collection) {
        collection.find().sort({ _id : -1 }).limit(10).toArray(function(err, items) {
			chatlinesrev = [];
			size = items.length;
			for (i=size;i>0; i--){
				chatlinesrev.push(items[i-1]);
	      	}
	       response.send(chatlinesrev);
	    });
    });
});

//= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = 

// CHECK IF INPUT FLIGHT IS VALID AND ON WOLFRAM
app.get(API_PREFIX + '/checkflight', function(req, res) {
	res.header("Access-Control-Allow-Origin", "*"); // fix this
 	res.header("Access-Control-Allow-Headers", "X-Requested-With");
	res.set('Content-Type', 'text/json');

	var params = "includepodid=FlightProperties:FlightData&includepodid=FlightSchedule:FlightData&includepodid=FlightStatus:FlightData&format=plaintext";
//	params = "format=plaintext";
	var args = JSON.parse(JSON.stringify(req.query));
	//query should be something like .../checkflight?flight=american+airlines+flight+1234
	var flight = args.flight;
	flight = encodeHTML(flight); //sanitize for scripts etc
	//flight will now be "american+airlines+flight+1234"

	var request = require('request');
		
	request('http://api.wolframalpha.com/v2/query?input=' + flight + "&appid=JJ5AL3-K5KPHHHLJH&" + params, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			if (response.body != null){
				var parseString = require('xml2js').parseString; //parse xml string
				parseString(body, function(err, result){
					jsonresult = JSON.stringify(result);	//parsed xml to string
//					console.dir(jsonresult);					
					jsonobj = JSON.parse(jsonresult);		//parsed string to json
					if (jsonobj.queryresult.$.success == 'true' && jsonobj.queryresult.$.error == 'false'){ //if successful query
						var responsestring = JSON.stringify(jsonobj.queryresult);
						if (responsestring.indexOf("arrived at") != -1){
							res.send({status:"has landed", plane:flight});
						}			
						else if (responsestring.indexOf("estimated to depart") != -1){
							res.send({status:"has not taken off yet", plane:flight});
						}
						else if (responsestring.indexOf("en route") != -1){
							res.send({status:"valid", plane:flight});
						}
						else{
							res.send({status:"is invalid", plane:flight});
						}
					}
					else res.send({status:"information not available from wolfram", plane:flight});
				});
			}
			else res.send({status:"info unavailable; cannot connect to wolfram 1", plane:flight});
		}
		else res.send({status:"info unavailable; cannot connect to wolfram 2", plane:flight});
	});
});

		
// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = 

// FIND NEARBY PLANES, PASSED USER LOCATION
app.get(API_PREFIX + '/nearbyplanes', function(request, res) {
	res.header("Access-Control-Allow-Origin", "*");		//fix this
  	res.header("Access-Control-Allow-Headers", "X-Requested-With");
  	
	res.set('Content-Type', 'text/json');

//	console.log ("NEARBYPLANES.JSON CALLED");

	//turn request into json and grab the coordinates
	var args = JSON.parse(JSON.stringify(request.query));
	var mylat = args.latitude;
	var mylon = args.longitude;

	query = "planes+above+" + mylat + "," + mylon;
	params = "format=plaintext";

	var errorobj = new Object;
	errorobj.status = "Error finding nearby flights";


	var request = require('request');
	// request('http://api.wolframalpha.com/v2/query?input=' + query + "&appid=JJ5AL3-K5KPHHHLJH&" + params, function (error, response, body) {
 request('http://api.wolframalpha.com/v2/query?input=' + "planes+above+boston" + "&appid=JJ5AL3-K5KPHHHLJH&" + params, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			if (response.body != null){
				var parseString = require('xml2js').parseString; //parse xml string
				parseString(body, function(err, result){
					jsonresult = JSON.stringify(result);	//parsed xml to string
//					console.dir(jsonresult);
					jsonobj = JSON.parse(jsonresult);		//parsed string to json
					if (jsonobj.queryresult.$.success == 'true' && jsonobj.queryresult.$.error == 'false'){ //if successful query
						if (jsonobj.queryresult.pod != undefined && jsonobj.queryresult.pod[0] != undefined && jsonobj.queryresult.pod[0].subpod != undefined && jsonobj.queryresult.pod[0].subpod[0] != undefined && jsonobj.queryresult.pod[0].subpod[0].plaintext != undefined){
							if (jsonobj.queryresult.pod[0].subpod[0].plaintext != "" && jsonobj.queryresult.pod[0].subpod[0].plaintext != "(data not available)"){		//if not blank and if the "data not available" response isnt sent
	//							console.dir("plaintext not blank and not unavailable");
								//now parse the plantext for all the planes							
								// multiple plane json response example: {"queryresult":{"$":{"success":"true","error":"false","numpods":"3","datatypes":"Flight","timedout":"","timedoutpods":"","timing":"1.86","parsetiming":"0.233","parsetimedout":"false","recalculate":"","id":"MSPa11591cf3abaef62e9ei500004agg6g7i9196bfc3","host":"http://www4b.wolframalpha.com","server":"38","related":"http://www4b.wolframalpha.com/api/v2/relatedQueries.jsp?id=MSPa11601cf3abaef62e9ei500001764dh078ghca005&s=38","version":"2.6"},"pod":[{"$":{"title":"Input interpretation","scanner":"Identity","id":"Input","position":"100","error":"false","numsubpods":"1"},"subpod":[{"$":{"title":""},"plaintext":["flights seen from Los Angeles, California"]}]},{"$":{"title":"Result","scanner":"Data","id":"Result","position":"200","error":"false","numsubpods":"1","primary":"true"},"subpod":[{"$":{"title":""},"plaintext":[" | altitude | angle\\nABX Air flight 1820 | 26800 feet | 12° up\\nHawaiian Airlines flight 36 | 37000 feet | 8.6° up\\nHawaiian Airlines flight 50 | 39000 feet | 7.2° up\\nAmerican Airlines flight 223 | 12300 feet | 6.9° up\\nAmerican Airlines flight 1035 | 5400 feet | 6.8° up\\n | type | slant distance\\nABX Air flight 1820 | Boeing 767-200 | 25 miles WNW\\nHawaiian Airlines flight 36 | Boeing 767-300 | 46 miles SSE\\nHawaiian Airlines flight 50 | Airbus A330-200 | 55 miles NW\\nAmerican Airlines flight 223 | Boeing 737-800 | 19 miles E\\nAmerican Airlines flight 1035 | Boeing 757-200 | 8.8 miles SE\\n(locations based on projections of delayed data)\\n(angles with respect to nominal horizon)"]}],"states":[{"$":{"count":"2"},"state":[{"$":{"name":"More","input":"Result__More"}},{"$":{"name":"Show metric","input":"Result__Show metric"}}]}]},{"$":{"title":"Sky map","scanner":"Data","id":"SkyMap:FlightData","position":"300","error":"false","numsubpods":"1"},"subpod":[{"$":{"title":""},"plaintext":[{}]}]}],"assumptions":[{"$":{"count":"1"},"assumption":[{"$":{"type":"SubCategory","word":"los angeles","template":"Assuming ${desc1}. Use ${desc2} instead","count":"4"},"value":[{"$":{"name":"{LosAngeles, California, UnitedStates}","desc":"Los Angeles (California, USA)","input":"*DPClash.CityE.los+angeles-_**LosAngeles.California.UnitedStates--"}},{"$":{"name":"{EastLosAngeles, California, UnitedStates}","desc":"East Los Angeles (California, USA)","input":"*DPClash.CityE.los+angeles-_**EastLosAngeles.California.UnitedStates--"}},{"$":{"name":"{LosAngeles, BioBio, Chile}","desc":"Los Angeles (Chile)","input":"*DPClash.CityE.los+angeles-_**LosAngeles.BioBio.Chile--"}},{"$":{"name":"{LosAngeles, Butuan, Philippines}","desc":"Los Angeles (Philippines)","input":"*DPClash.CityE.los+angeles-_**LosAngeles.Butuan.Philippines--"}}]}]}],"sources":[{"$":{"count":"2"},"source":[{"$":{"url":"http://www.wolframalpha.com/sources/CityDataSourceInformationNotes.html","text":"City data"}},{"$":{"url":"http://www.wolframalpha.com/sources/FlightDataSourceInformationNotes.html","text":"Flight data"}}]}]}}
								var plainplanes = jsonobj.queryresult.pod[1].subpod[0].plaintext[0];
	//							console.log(plainplanes);
								if (plainplanes == "(data not available)"){
									res.send('{"status":"Data not available from wolfram"}');
								}
								else{
								// an example plainplanes is ' | altitude | angle\nABX Air flight 1820 | 21100 feet | 9.2° up\nHawaiian Airlines flight 50 | 39000 feet | 7.8° up\nHawaiian Airlines flight 36 | 37000 feet | 7.5° up\nAmerican Airlines flight 223 | 8700 feet | 6° up\n | type | slant distance\nABX Air flight 1820 | Boeing 767-200 | 24 miles WNW\nHawaiian Airlines flight 50 | Airbus A330-200 | 51 miles NNW\nHawaiian Airlines flight 36 | Boeing 767-300 | 52 miles SSE\nAmerican Airlines flight 223 | Boeing 737-800 | 16 miles ESE\n(locations based on projections of delayed data)\n(angles with respect to nominal horizon)'
								// now we clean it up removing the \n's and separating using the pipe delimiter then selecting only strings with "flight" in them

									cleandata = plainplanes.replace(/(\r\n|\n|\r)/gm," | "); //make linebreaks into pipes
									dataarray = cleandata.split(' | ');
									flightsfound = []; // the flights found

									for (var i = 0; i < dataarray.length; i++){
										//indexOf returns the position of the string in the other string. If not found, it will return -1:
										if (dataarray[i].indexOf("flight") != -1){
	//										console.log("searching " + dataarray[i]);
											flightsfound.push(dataarray[i]); //fill list of planes
										}
									}
									// now flightsfound is like ["ABX Air flight 1820", "Hawaiian Airlines flight 50", "Hawaiian Airlines flight 36", "American Airlines flight 223", "ABX Air flight 1820", "Hawaiian Airlines flight 50", "Hawaiian Airlines flight 36", "American Airlines flight 223"]
									flightsfoundstring = JSON.stringify(flightsfound);
									res.send(flightsfoundstring);
								}
							}
							else res.send(errorobj);
						}
						else res.send(errorobj);
					}
					else res.send(errorobj);
				});
			}
			else res.send(errorobj);
		}
		else res.send(errorobj);
	});
//	res.send("{'end'}");
});

// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = 

// CURRENTDATA(.json)
// REQUEST PARAMETER: &flight+company+flight+###
// RESPONSE (example): {status:1, "time": "Current information (10:20 pm EDT)", "altitude": 36900, "position": "44.52N, 87.53W", "speed": 519, "distance": 1816, "latitude": 44.52, "longitude": -87.53}
//          (example2): {status:'errorA'}	
//			(example3): {status:'landed'}
//			(example4): {status:'Plane hasn't taken off yet or post-takeoff data not available yet'}
app.get(API_PREFIX + '/currentdata', function(req, res) {
	res.header("Access-Control-Allow-Origin", "*");		//fix this
  	res.header("Access-Control-Allow-Headers", "X-Requested-With");
	res.set('Content-Type', 'text/json');

	//calculate 15 mins ago to search for data from 15 min ago
	curtime = new Date();
	// 15 mins = 15 mins behind; 60000 = miliseconds per minute
	var searchtime = new Date(curtime - (15 * 60000));

	var searchhour = searchtime.getHours().toString();
	var searchmin = searchtime.getMinutes().toString();
	
	var timelong = searchhour + ":";
	if (searchmin.length == 1){
		timelong = timelong + "0";
	}
	var timeago = timelong + searchmin;

	//turn request into json and grab flight
	var args = JSON.parse(JSON.stringify(req.query));
	var flight = args.flight.replace(/ /g, "+");
	
	var params = "includepodid=FlightProperties:FlightData&includepodid=FlightSchedule:FlightData&includepodid=FlightStatus:FlightData&format=plaintext";


//test flight s
//	flight = "air+canada+flight+100";
//  flight = "united+airlines+flight+94";

	var errorobj = new Object;
	errorobj.status = "Error finding flight info";

	var url = 'http://api.wolframalpha.com/v2/query?input=' + flight + "+at+" + timeago + "&appid=JJ5AL3-K5KPHHHLJH&" + params;

	var request = require('request');
	request(url, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			if (response.body != null){
				var parseString = require('xml2js').parseString; //parse xml string
				parseString(body, function(err, result){
					jsonresult = JSON.stringify(result);	//parsed xml to string
					// console.dir(jsonresult);
					jsonobj = JSON.parse(jsonresult);		//parsed string to json
					if (jsonobj.queryresult.$.success == 'true' && jsonobj.queryresult.$.error == 'false'){ //if successful query
							
					// check if entire string contains "actual landing time"
						var responsestring = JSON.stringify(jsonobj.queryresult);
						if (responsestring.indexOf("arrived at") != -1){
							res.send('{"status":"landed"}');
						}			
						else{
							if (responsestring.indexOf("estimated to depart") != -1){
								res.send('{"status":"Plane hasn\'t taken off yet or post-takeoff data not available yet"}');
							}
							else if (responsestring.indexOf("en route") != -1){
							
								var departfrom = undefined;
								var arriveat = undefined;
							
								//COLLECT DEPARTURE AIRPORT AND DESTINATION AIRPORT
								if (jsonobj.queryresult.pod != undefined && jsonobj.queryresult.pod[1] != undefined && jsonobj.queryresult.pod[1].subpod != undefined && jsonobj.queryresult.pod[1].subpod[0] != undefined && jsonobj.queryresult.pod[1].subpod[0].plaintext != undefined && jsonobj.queryresult.pod[1].subpod[0].plaintext != ""){
									
									var data = JSON.stringify(jsonobj.queryresult.pod[1].subpod[0].plaintext[0]);
									data = data.replace(/\\n/g, " || "); //put in || for splitting into array
									data = data.replace("\"", ''); //remove double quotes
									var dataarray = data.split(' || ');
									for (var i = 0; i < dataarray.length; i++){
										var datumarray = dataarray[i].split(' | '); //split into individual fields
										if (datumarray[0] == "departure airport"){
											departfrom = datumarray[1];
										}
										if (datumarray[0] == "arrival airport"){
											arriveat = datumarray[1];
										}
									}
								}
							
								//COLLECT ALTITUDE, DISTANCE, COORDINATES, SPEED, THEN TIME IN SEPARATE POD
								if (jsonobj.queryresult.pod != undefined && jsonobj.queryresult.pod[2] != undefined && jsonobj.queryresult.pod[2].subpod != undefined && jsonobj.queryresult.pod[2].subpod[0] != undefined && jsonobj.queryresult.pod[2].subpod[0].plaintext != undefined && jsonobj.queryresult.pod[2].subpod[0].plaintext != ""){
									var data = JSON.stringify(jsonobj.queryresult.pod[2].subpod[0].plaintext[0]);
										
//									console.dir(data);	
																	
									data = data.replace(/\\n/g, " || ");
									data = data.replace("\"", ''); //remove double quotes
									data = data.replace("°N", "N").replace("°S", "S").replace("°W", "W").replace("°E", "E");
									var dataarray = data.split(' || ');
						
									finaldata = [];
						
									for (var i = 0; i < dataarray.length; i++){
										var datumarray = dataarray[i].split(' | ');
										if (datumarray[0] == "altitude"){
											finaldata['altitude'] = datumarray[1];
										}
										else if (datumarray[0] == "position"){
											finaldata['position'] = datumarray[1];
										}
										else if (datumarray[0] == "ground speed"){
											finaldata['speed'] = datumarray[1];
										}
										else if (datumarray[0] == "distance traveled"){
											finaldata['distance'] = datumarray[1];
										}
									}	
						
									if (jsonobj.queryresult.pod[2].$ != undefined && jsonobj.queryresult.pod[2].$.title != undefined && jsonobj.queryresult.pod[2].$.title != ""){
										var time = JSON.stringify(jsonobj.queryresult.pod[2].$.title);
										time = time.replace(/["']/g, ""); //remove double quotes							
										finaldata['time'] = time;
									}
									else{
										console.log("notime");
										finaldata['time'] = undefined;
									}
						
									// Still need to convert coordinates into google maps acceptible coords
									// 		making the south and west degrees negative
									// Still need to clean up distance & speed into pure numbers

									if (finaldata['distance'] != undefined){
										finaldata['distance'] = parseInt(finaldata['distance']);
									}
									if (finaldata['speed'] != undefined){
										finaldata['speed'] = parseInt(finaldata['speed']);
									}

									// must clean up altitude before converting
									// 		altitude | 37000 feet (7 miles) 
									// the (x miles) messes up the parse int; must remove it

									var flagged = false;
									var tally = 0;
									if (finaldata['altitude'] != undefined){
										while (flagged == false && tally < 20){
											var alt = finaldata['altitude'];
											var nummiles = "(" + tally + " miles)";
											var cleanalt = alt.replace(nummiles, "");
											if (cleanalt == alt){
												//didn't change it; continue cycling
												tally++;
											}
											else{ //did clean up the (x miles) in string; replace
												finaldata['altitude'] = cleanalt;
												tally = 0;
												flagged = true; //end
											}
										}
										finaldata['altitude'] = parseInt(finaldata['altitude']);
									}

							// does mph turn to kilometers when flying over canada? would mess up parseint
							// also feet to meters in altitude
							// standardize query ^^?

									//Still need to turn coordinates like 46.02N, 64W to 46.02, -64
			
									if (finaldata['position'] != undefined){
										var coords = finaldata['position'].split(', ');
										var lat = coords[0];	
										var lon = coords[1];
									
										//LATITUDE CONVERSION						
										var directionindex = lat.indexOf("N");
										if (directionindex != -1){ //if string contains letter N
											//north: make it positive int
											finaldata['latitude'] = parseFloat(lat);
										}
										else{ 
											directionindex = lat.indexOf("S");
											if (directionindex != -1){
												//south: make it a negative integer
												finaldata['latitude'] = parseFloat(lat)*-1;
											}
										}
										// LONGITUDE CONVERSION									
										directionindex = lon.indexOf("W");
										if (directionindex != -1){
											//west: make it a negative integer
											finaldata['longitude'] = parseFloat(lon)*-1;
										}
										else{
											directionindex = lon.indexOf("E");
											//east: positive integer
											if (directionindex != -1){
												finaldata['longitude'] = parseFloat(lon);
											}
										}
									}
																
									dataobj = new Object;
									
									
									if (arriveat != undefined){
										dataobj.arriveat = arriveat;
									}
									if (departfrom != undefined){
										dataobj.departfrom = departfrom;
									}
									if (finaldata['time'] != undefined){
										dataobj.time = finaldata['time'];								
									}
									if (finaldata['altitude'] != undefined){
										dataobj.altitude = finaldata['altitude'];								
									}									
									if (finaldata['position'] != undefined){
										dataobj.position = finaldata['position'];								
									}									
									if (finaldata['speed'] != undefined){
										dataobj.speed = finaldata['speed'];								
									}									
									if (finaldata['distance'] != undefined){
										dataobj.distance = finaldata['distance'];								
									}									
									if (finaldata['latitude'] != undefined){
										dataobj.latitude = finaldata['latitude'];								
									}									
									if (finaldata['longitude'] != undefined){
										dataobj.longitude = finaldata['longitude'];								
									}		
									
									if (finaldata['position'] == undefined && finaldata['time'] == undefined && finaldata['speed'] == undefined && finaldata['position'] == undefined && finaldata['distance'] == undefined && finaldata['latitude'] == undefined && finaldata['longitude'] == undefined && finaldata['time'] == undefined){
										console.log("en route but no data found");
										console.log("sending back " + tally);
										tally++;
										dataobj.status = 2;
										res.send (errorobj);
									}
									else{									
										dataobj.status = 1;
//										console.log(dataobj);
										res.send(dataobj);
									}
								}
								else res.send(errorobj);
							}
							else res.send(errorobj);
						}	
					}
					else res.send(errorobj);
				});
			}
			else res.send(errorobj);	
		}
		else res.send(errorobj);
	});
});


// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = 

var port = process.env.PORT || 5000;
app.listen(port, function() {
	console.log("Listening on " + port);
});

//

function encodeHTML(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}
