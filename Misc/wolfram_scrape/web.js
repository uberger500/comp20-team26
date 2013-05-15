/*








NOW COMBINED WITH API.JS




























https://github.com/macdonst/Ottawa-JavaScript-SpeechRec/blob/master/index.html
http://planaheadonline.com/tester.html
http://stackoverflow.com/questions/16268930/wolfram-api-javascript-cross-origin-sharing-issue
http://www.sitepoint.com/making-http-requests-in-node-js/

https://github.com/mikeal/request


REQUIRED:
npm install request			https://github.com/mikeal/request
npm install xml2js			https://github.com/Leonidas-from-XIV/node-xml2js

*/

// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = 

// Express initialization
var express = require('express');
var app = express(express.logger());
app.use(express.bodyParser()); //auto converts string to json format
app.set('title', 'wingman');

// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = 


app.get('/', function(request, response) {
  response.send('Hello World!');
});


// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = 

// CHECK IF INPUT FLIGHT IS VALID AND ON WOLFRAM
app.get('/checkflight', function(req, res) {
	res.header("Access-Control-Allow-Origin", "*");		//fix this
  	res.header("Access-Control-Allow-Headers", "X-Requested-With");
	res.set('Content-Type', 'text/html');


// ALSO NEED TO SANITIZE INPUT******


	params = "format=plaintext";
	var args = JSON.parse(JSON.stringify(req.query));
	//query should be something like .../checkflight?flight=american+airlines+flight+1234
	var flight = args.flight;
	//flight will now be "american+airlines+flight+1234"
	
	var request = require('request');
	request('http://api.wolframalpha.com/v2/query?input=' + flight + "&appid=LUJKX2-LP3GW5VUGX&" + params, function (error, response, body) {
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
app.get('/nearbyplanes.json', function(request, res) {
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

//	console.log(query + " - " + params);

	var request = require('request');
//	request('http://api.wolframalpha.com/v2/query?input=' + query + "&appid=LUJKX2-LP3GW5VUGX&" + params, function (error, response, body) {
	request('http://api.wolframalpha.com/v2/query?input=' + "planes+above+los+angeles" + "&appid=LUJKX2-LP3GW5VUGX&" + params, function (error, response, body) {
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


function testflight(){ // QUERY ONLY WORKS SERVICE SIDE, CAN'T BE RUN IN JAVASCRIPT ALONE

// CHANGE THIS QUERY FOR DIFFERENT FLIGHTS
query = "spirit+airlines+flight+451";
params = "includepodid=FlightProperties:FlightData&format=plaintext";

	var request = require('request');
	request('http://api.wolframalpha.com/v2/query?input=' + query + "&appid=LUJKX2-LP3GW5VUGX&" + params, function (error, response, body) {
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

