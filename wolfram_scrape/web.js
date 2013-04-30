/*
https://github.com/macdonst/Ottawa-JavaScript-SpeechRec/blob/master/index.html
http://planaheadonline.com/tester.html
http://stackoverflow.com/questions/16268930/wolfram-api-javascript-cross-origin-sharing-issue
http://www.sitepoint.com/making-http-requests-in-node-js/

https://github.com/mikeal/request


REQUIRED:
npm install request			https://github.com/mikeal/request
npm install xml2js			https://github.com/Leonidas-from-XIV/node-xml2js

*/


var express = require('express');

var app = express.createServer(express.logger());

app.get('/', function(request, response) {
  response.send('Hello World!');
});


// CHANGE THIS QUERY FOR DIFFERENT FLIGHTS
query = "spirit+airlines+flight+451";
params = "includepodid=FlightProperties:FlightData&format=plaintext";

var request = require('request');
request('http://api.wolframalpha.com/v2/query?input=' + query + "&appid=PGPETX-U8JRYTGGRH&" + params, function (error, response, body) {
  if (!error && response.statusCode == 200) {
    
	var parseString = require('xml2js').parseString;
	parseString(body, function(err, result){
		jsonresult = JSON.stringify(result);
//		console.dir(jsonresult);
		jsonobj = JSON.parse(jsonresult);

		// need more if statements for responses with missing results
		if (jsonobj.queryresult.$.success == 'true'){
		
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
})


/*
// Beginnings of planes above boston query
var request = require('request');
request('http://api.wolframalpha.com/v2/query?input=planes+above+boston&appid=PGPETX-U8JRYTGGRH', function (error, response, body) {
//request('http://api.wolframalpha.com/v2/query?input=planes+above+boston&appid=PGPETX-U8JRYTGGRH&includepodid=Result&format=plaintext', function (error, response, body) {

  if (!error && response.statusCode == 200) {
	var parseString = require('xml2js').parseString;
	parseString(body, function(err, result){
		jsonresult = JSON.stringify(result);
		console.dir(jsonresult);
		jsonobj = JSON.parse(jsonresult);
		console.dir(jsonobj.queryresult);	//.pod[1].subpod[0].plaintext[0]);
	});
  }
})
*/


var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("Listening on " + port);
});

