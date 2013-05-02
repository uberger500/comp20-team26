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
	response.send('Homepage');
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
	bcrypt.hash(pass, 10, function(err, hash) {
		models.User.create({
			name : request.param('name'),
			email : request.param('email'),
			password : hash
		}, function(err, user) {
			if (err || !user) {
				response.json({success: false, error: 'Error creating new user'});
			} else {
				response.json({success: true, user: user});
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

app.post(API_PREFIX + '/score/submit.json', function(request, response) {
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


// CHECK IF INPUT FLIGHT IS VALID AND ON WOLFRAM
app.get(API_PREFIX + '/checkflight', function(req, res) {
	res.header("Access-Control-Allow-Origin", "*"); // fix this
 	res.header("Access-Control-Allow-Headers", "X-Requested-With");
	res.set('Content-Type', 'text/html');


// ALSO NEED TO SANITIZE INPUT******


	params = "format=plaintext";
	var args = JSON.parse(JSON.stringify(req.query));
	//query should be something like .../checkflight?flight=american+airlines+flight+1234
	var flight = args.flight;
	//flight will now be "american+airlines+flight+1234"

	var request = require('request');
	request('http://api.wolframalpha.com/v2/query?input=' + flight + "&appid=PGPETX-U8JRYTGGRH&" + params, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			if (response.body != null){
				var parseString = require('xml2js').parseString; //parse xml string
				parseString(body, function(err, result){
					jsonresult = JSON.stringify(result);	//parsed xml to string
//					console.dir(jsonresult);					
					jsonobj = JSON.parse(jsonresult);		//parsed string to json
					if (jsonobj.queryresult.$.success == 'true' && jsonobj.queryresult.$.error == 'false'){ //if successful query
						// if the plantext contains (today) or (yesterday) or (tomorrow) 
						// they will contain these if they are ongoing or just landed or about to depart
						// therefore if the user makes a typo they won't get stuck with an old but valid flight
						var responsestring = JSON.stringify(jsonobj.queryresult);
						if (responsestring.indexOf("(today)") != -1 || responsestring.indexOf("(yesterday)") != -1 || responsestring.indexOf("(tomorrow)") != -1){
							res.send("valid flight");
						}
						else res.send("invalid flight");
					}
					else res.send("invalid flight");
				});
			}
			else res.send("invalid flight");
		}
		else res.send("invalid flight");
	});
});

// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = 






// Next API to code: If the input flight or chosen flight is valid, it must be POSTed to the user's account and data needs to start being collected





// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = 

// FIND NEARBY PLANES, PASSED USER LOCATION
app.get(API_PREFIX + '/nearbyplanes.json', function(request, res) {
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


//HARDCODED WITH A TOKEN CURRENTLY

	var request = require('request');
//	request('http://api.wolframalpha.com/v2/query?input=' + query + "&appid=PGPETX-U8JRYTGGRH&" + params, function (error, response, body) {
	request('http://api.wolframalpha.com/v2/query?input=' + "planes+above+los+angeles" + "&appid=PGPETX-U8JRYTGGRH&" + params, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			if (response.body != null){
				var parseString = require('xml2js').parseString; //parse xml string
				parseString(body, function(err, result){
					jsonresult = JSON.stringify(result);	//parsed xml to string
					console.dir(jsonresult);
					jsonobj = JSON.parse(jsonresult);		//parsed string to json
					if (jsonobj.queryresult.$.success == 'true' && jsonobj.queryresult.$.error == 'false'){ //if successful query
						if (jsonobj.queryresult.pod[0].subpod[0].plaintext != "" && jsonobj.queryresult.pod[0].subpod[0].plaintext != "(data not available)"){		//if not blank and if the "data not available" response isnt sent
							console.dir("plaintext not blank and not unavailable");
							//now parse the plantext for all the planes							
							// multiple plane json response example: {"queryresult":{"$":{"success":"true","error":"false","numpods":"3","datatypes":"Flight","timedout":"","timedoutpods":"","timing":"1.86","parsetiming":"0.233","parsetimedout":"false","recalculate":"","id":"MSPa11591cf3abaef62e9ei500004agg6g7i9196bfc3","host":"http://www4b.wolframalpha.com","server":"38","related":"http://www4b.wolframalpha.com/api/v2/relatedQueries.jsp?id=MSPa11601cf3abaef62e9ei500001764dh078ghca005&s=38","version":"2.6"},"pod":[{"$":{"title":"Input interpretation","scanner":"Identity","id":"Input","position":"100","error":"false","numsubpods":"1"},"subpod":[{"$":{"title":""},"plaintext":["flights seen from Los Angeles, California"]}]},{"$":{"title":"Result","scanner":"Data","id":"Result","position":"200","error":"false","numsubpods":"1","primary":"true"},"subpod":[{"$":{"title":""},"plaintext":[" | altitude | angle\\nABX Air flight 1820 | 26800 feet | 12° up\\nHawaiian Airlines flight 36 | 37000 feet | 8.6° up\\nHawaiian Airlines flight 50 | 39000 feet | 7.2° up\\nAmerican Airlines flight 223 | 12300 feet | 6.9° up\\nAmerican Airlines flight 1035 | 5400 feet | 6.8° up\\n | type | slant distance\\nABX Air flight 1820 | Boeing 767-200 | 25 miles WNW\\nHawaiian Airlines flight 36 | Boeing 767-300 | 46 miles SSE\\nHawaiian Airlines flight 50 | Airbus A330-200 | 55 miles NW\\nAmerican Airlines flight 223 | Boeing 737-800 | 19 miles E\\nAmerican Airlines flight 1035 | Boeing 757-200 | 8.8 miles SE\\n(locations based on projections of delayed data)\\n(angles with respect to nominal horizon)"]}],"states":[{"$":{"count":"2"},"state":[{"$":{"name":"More","input":"Result__More"}},{"$":{"name":"Show metric","input":"Result__Show metric"}}]}]},{"$":{"title":"Sky map","scanner":"Data","id":"SkyMap:FlightData","position":"300","error":"false","numsubpods":"1"},"subpod":[{"$":{"title":""},"plaintext":[{}]}]}],"assumptions":[{"$":{"count":"1"},"assumption":[{"$":{"type":"SubCategory","word":"los angeles","template":"Assuming ${desc1}. Use ${desc2} instead","count":"4"},"value":[{"$":{"name":"{LosAngeles, California, UnitedStates}","desc":"Los Angeles (California, USA)","input":"*DPClash.CityE.los+angeles-_**LosAngeles.California.UnitedStates--"}},{"$":{"name":"{EastLosAngeles, California, UnitedStates}","desc":"East Los Angeles (California, USA)","input":"*DPClash.CityE.los+angeles-_**EastLosAngeles.California.UnitedStates--"}},{"$":{"name":"{LosAngeles, BioBio, Chile}","desc":"Los Angeles (Chile)","input":"*DPClash.CityE.los+angeles-_**LosAngeles.BioBio.Chile--"}},{"$":{"name":"{LosAngeles, Butuan, Philippines}","desc":"Los Angeles (Philippines)","input":"*DPClash.CityE.los+angeles-_**LosAngeles.Butuan.Philippines--"}}]}]}],"sources":[{"$":{"count":"2"},"source":[{"$":{"url":"http://www.wolframalpha.com/sources/CityDataSourceInformationNotes.html","text":"City data"}},{"$":{"url":"http://www.wolframalpha.com/sources/FlightDataSourceInformationNotes.html","text":"Flight data"}}]}]}}
							var plainplanes = jsonobj.queryresult.pod[1].subpod[0].plaintext[0];
							console.log(plainplanes);
							if (plainplanes == "(data not available)"){
								res.send("{'error0'}");
								console.log("error 0");
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
										console.log("searching " + dataarray[i]);
										flightsfound.push(dataarray[i]); //fill list of planes
									}
								}
								// now flightsfound is like ["ABX Air flight 1820", "Hawaiian Airlines flight 50", "Hawaiian Airlines flight 36", "American Airlines flight 223", "ABX Air flight 1820", "Hawaiian Airlines flight 50", "Hawaiian Airlines flight 36", "American Airlines flight 223"]
								flightsfoundstring = JSON.stringify(flightsfound);
								res.send(flightsfoundstring);
							}
						}
						else res.send("{'error1'}");
					}
					else res.send("{'error2'}");
				});
			}
			else res.send("{'error3'}");	
		}
		else res.send("{'error4'}");
	});
//	res.send("{'end'}");
});

// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = 

// Collect data bout the given flight
// will call update user data api

app.get(API_PREFIX + '/newflightdata.json', function(req, res) {
	res.header("Access-Control-Allow-Origin", "*");		//fix this
  	res.header("Access-Control-Allow-Headers", "X-Requested-With");
  	
	res.set('Content-Type', 'text/json');

	//turn request into json and grab flight
	var args = JSON.parse(JSON.stringify(req.query));
	var flight = args.flight;


//HARDCODED WITH TOKEN CURRENTLY
	var params = "includepodid=FlightProperties:FlightData&format=plaintext";



//test flight is delta flight 825
	flight = "delta+flight+825";



	var request = require('request');
	request('http://api.wolframalpha.com/v2/query?input=' + flight + "&appid=PGPETX-U8JRYTGGRH&" + params, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			if (response.body != null){
				var parseString = require('xml2js').parseString; //parse xml string
				parseString(body, function(err, result){
					jsonresult = JSON.stringify(result);	//parsed xml to string
					console.dir(jsonresult);
					jsonobj = JSON.parse(jsonresult);		//parsed string to json
					if (jsonobj.queryresult.$.success == 'true' && jsonobj.queryresult.$.error == 'false'){ //if successful query
						if (jsonobj.queryresult.pod[0].subpod[0].plaintext != "" && jsonobj.queryresult.pod[0].subpod[0].plaintext != "(data not available)"){		//if not blank and if the "data not available" response isnt sent
							console.dir("plaintext not blank and not unavailable");
							//now parse the plantext for all the planes							
							// multiple plane json response example: {"queryresult":{"$":{"success":"true","error":"false","numpods":"3","datatypes":"Flight","timedout":"","timedoutpods":"","timing":"1.86","parsetiming":"0.233","parsetimedout":"false","recalculate":"","id":"MSPa11591cf3abaef62e9ei500004agg6g7i9196bfc3","host":"http://www4b.wolframalpha.com","server":"38","related":"http://www4b.wolframalpha.com/api/v2/relatedQueries.jsp?id=MSPa11601cf3abaef62e9ei500001764dh078ghca005&s=38","version":"2.6"},"pod":[{"$":{"title":"Input interpretation","scanner":"Identity","id":"Input","position":"100","error":"false","numsubpods":"1"},"subpod":[{"$":{"title":""},"plaintext":["flights seen from Los Angeles, California"]}]},{"$":{"title":"Result","scanner":"Data","id":"Result","position":"200","error":"false","numsubpods":"1","primary":"true"},"subpod":[{"$":{"title":""},"plaintext":[" | altitude | angle\\nABX Air flight 1820 | 26800 feet | 12° up\\nHawaiian Airlines flight 36 | 37000 feet | 8.6° up\\nHawaiian Airlines flight 50 | 39000 feet | 7.2° up\\nAmerican Airlines flight 223 | 12300 feet | 6.9° up\\nAmerican Airlines flight 1035 | 5400 feet | 6.8° up\\n | type | slant distance\\nABX Air flight 1820 | Boeing 767-200 | 25 miles WNW\\nHawaiian Airlines flight 36 | Boeing 767-300 | 46 miles SSE\\nHawaiian Airlines flight 50 | Airbus A330-200 | 55 miles NW\\nAmerican Airlines flight 223 | Boeing 737-800 | 19 miles E\\nAmerican Airlines flight 1035 | Boeing 757-200 | 8.8 miles SE\\n(locations based on projections of delayed data)\\n(angles with respect to nominal horizon)"]}],"states":[{"$":{"count":"2"},"state":[{"$":{"name":"More","input":"Result__More"}},{"$":{"name":"Show metric","input":"Result__Show metric"}}]}]},{"$":{"title":"Sky map","scanner":"Data","id":"SkyMap:FlightData","position":"300","error":"false","numsubpods":"1"},"subpod":[{"$":{"title":""},"plaintext":[{}]}]}],"assumptions":[{"$":{"count":"1"},"assumption":[{"$":{"type":"SubCategory","word":"los angeles","template":"Assuming ${desc1}. Use ${desc2} instead","count":"4"},"value":[{"$":{"name":"{LosAngeles, California, UnitedStates}","desc":"Los Angeles (California, USA)","input":"*DPClash.CityE.los+angeles-_**LosAngeles.California.UnitedStates--"}},{"$":{"name":"{EastLosAngeles, California, UnitedStates}","desc":"East Los Angeles (California, USA)","input":"*DPClash.CityE.los+angeles-_**EastLosAngeles.California.UnitedStates--"}},{"$":{"name":"{LosAngeles, BioBio, Chile}","desc":"Los Angeles (Chile)","input":"*DPClash.CityE.los+angeles-_**LosAngeles.BioBio.Chile--"}},{"$":{"name":"{LosAngeles, Butuan, Philippines}","desc":"Los Angeles (Philippines)","input":"*DPClash.CityE.los+angeles-_**LosAngeles.Butuan.Philippines--"}}]}]}],"sources":[{"$":{"count":"2"},"source":[{"$":{"url":"http://www.wolframalpha.com/sources/CityDataSourceInformationNotes.html","text":"City data"}},{"$":{"url":"http://www.wolframalpha.com/sources/FlightDataSourceInformationNotes.html","text":"Flight data"}}]}]}}
							var plainplanes = jsonobj.queryresult.pod[1].subpod[0].plaintext[0];
							console.log(plainplanes);
							if (plainplanes == "(data not available)"){
								res.send("{'error0'}");
								console.log("error 0");
							}
							else{
							// an example plainplanes is ' | altitude | angle\nABX Air flight 1820 | 21100 feet | 9.2° up\nHawaiian Airlines flight 50 | 39000 feet | 7.8° up\nHawaiian Airlines flight 36 | 37000 feet | 7.5° up\nAmerican Airlines flight 223 | 8700 feet | 6° up\n | type | slant distance\nABX Air flight 1820 | Boeing 767-200 | 24 miles WNW\nHawaiian Airlines flight 50 | Airbus A330-200 | 51 miles NNW\nHawaiian Airlines flight 36 | Boeing 767-300 | 52 miles SSE\nAmerican Airlines flight 223 | Boeing 737-800 | 16 miles ESE\n(locations based on projections of delayed data)\n(angles with respect to nominal horizon)'
							// now we clean it up removing the \n's and separating using the pipe delimiter then selecting only strings with "flight" in them
							
								cleandata = plainplanes.replace(/(\r\n|\n|\r)/gm," | "); //make linebreaks into pipes
								dataarray = cleandata.split(' | ');
							}
						}
					}
				});
			}
		}
	});
});








// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = 


function testflight(){ // QUERY ONLY WORKS SERVICE SIDE, CAN'T BE RUN IN JAVASCRIPT ALONE

// CHANGE THIS QUERY FOR DIFFERENT FLIGHTS
query = "spirit+airlines+flight+451";
params = "includepodid=FlightProperties:FlightData&format=plaintext";

	var request = require('request');
	request('http://api.wolframalpha.com/v2/query?input=' + query + "&appid=PGPETX-U8JRYTGGRH&" + params, function (error, response, body) {
 	if (!error && response.statusCode == 200) {
 		
		var parseString = require('xml2js').parseString;
		parseString(body, function(err, result){
			jsonresult = JSON.stringify(result);
			jsonobj = JSON.parse(jsonresult);

			// need more if statements for responses with missing results
			if (jsonobj.queryresult.$.success == 'true' && jsonobj.queryresult.$.error == 'false'){
		
				var roughdata = JSON.stringify(jsonobj.queryresult.pod[0].subpod[0].plaintext[0]);
				// currently format like 'altitude | 37000 feet  (7 miles)\nposition | 45.67°N, 64.72°W\nground speed | 541 mph  (miles per hour)\nheading | 54°  (degrees)  (NE)\ndistance traveled | 2692 miles'
				// ^ problem 1: pipe delimiter; problem 2: \n
			
		//		roughdata = 'altitude | 37000 feet  (7 miles)\\nposition | 46.02°N, 64°W\\nground speed | 552 mph  (miles per hour)\\nheading | 70°  (degrees)  (ENE)\\ndistance traveled | 2735 miles';

				var cleandata = roughdata.replace(/\\n/g, " || ");
				var cleandata2 = cleandata.replace("\"", ''); //remove double quotes
				var cleanerdata = cleandata2.replace("°N", "N").replace("°S", "S").replace("°W", "W").replace("°E", "E");

				var dataarray = cleanerdata.split(' || ');

				finaldata = [];

				//5 indices, need to split into key value pairs
				/*
				altitude | 37000 feet (7 miles) 
				position | 46.02N, 64W 
				ground speed | 552 mph (miles per hour) 
				heading | 70Â° (degrees) (ENE) 
				distance traveled | 2735 miles
				*/

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
		
				finaldata['time'] = jsonobj.queryresult.pod[0].$.title;

				//now finaldata is loaded with alt, pos, speed, distance:
				//finaldata['altitude'] = 
				//finaldata['distance'] = "2735 miles"
				//finaldata['speed'] = "552 mpg (miles per hour)"
				//finaldata['position'] = "46.02N, 64W" 
				//finaldata['time'] = Current information (2:40 am EDT)
			
				// Still need to convert coordinates into google maps acceptible coords
				// 		making the south and west degrees negative
				// Still need to clean up distance & speed into pure numbers

				finaldata['distance'] = parseInt(finaldata['distance']);
				finaldata['speed'] = parseInt(finaldata['speed']);

				// must clean up altitude before converting
				// 		altitude | 37000 feet (7 miles) 
				// the (x miles) messes up the parse int; must remove it
		
				var flagged = false;
				var tally = 0;
				
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

		// does mph turn to kilometers when flying over canada? would mess up parseint
		// also feet to meters in altitude
		// standardize query ^^?

				//Still need to turn coordinates like 46.02N, 64W to 4.02, -64
			
				var coords = finaldata['position'].split(', ');
				var lat = coords[0];	
				var lon = coords[1];

				var directionindex = lat.indexOf("N");

				//LATITUDE CONVERSION
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

					console.dir(finaldata);
				}
				else {
					console.dir("FAILED RESPONSE");
				}
			});
		}
	});
}

var port = process.env.PORT || 5000;
app.listen(port, function() {
	console.log("Listening on " + port);
});