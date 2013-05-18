var fieldscorner = new google.maps.LatLng(42.300093,-71.061667);
var myOptions = {
	zoom: 7, // The larger the zoom number, the bigger the zoom
	center: fieldscorner,	// center south station while your location loads
	mapTypeId: google.maps.MapTypeId.HYBRID
	};
var map;
var myLat = 0;
var myLng = 0;
var myLoc = new google.maps.LatLng(0,0);
var request = new XMLHttpRequest();




// Arrays of google.maps.LatLng coordinates used to draw the polyline paths
var polyline = [];
var markers = [];

//Delta 818
var planecoords = [];
planecoords.push([44.88, -93.22]);
planecoords.push([45.02, -93.14]);
planecoords.push([45.31, -92.16]);
planecoords.push([45.24, -90.96]);
planecoords.push([45.18, -90.16]);
planecoords.push([45.09, -89.13]);
planecoords.push([45.01, -88.16]);
planecoords.push([44.88, -86.94]);
planecoords.push([44.75, -85.98]);
planecoords.push([44.68, -85.17]);
planecoords.push([44.53, -84.03]);
planecoords.push([44.41, -83.15]);
planecoords.push([44.17, -82.07]);
planecoords.push([43.97, -81.12]);
planecoords.push([43.77, -80.13]);
/*planecoords.push([43.6, -79.2]);
planecoords.push([43.47, -78.24]);
planecoords.push([43.3, -77.2]);
planecoords.push([43.19, -76.35]);
planecoords.push([42.95, -75.36]);
planecoords.push([42.77, -74.55]);
planecoords.push([42.71, -73.44]);
planecoords.push([42.65, -72.5]);
planecoords.push([42.59, -72.18]);
planecoords.push([42.52, -71.65]);
planecoords.push([42.48, -71.34]);
planecoords.push([42.45, -71.05]);
planecoords.push([42.38, -70.9]);
planecoords.push([42.33, -70.82]);
planecoords.push([42.28, -70.83]);
planecoords.push([42.27, -70.88]);
planecoords.push([42.42, -70.93]);
planecoords.push([42.33, -70.95]);
planecoords.push([42.33, -70.97]);
planecoords.push([42.35, -70.99]);
planecoords.push([42.3631, -71.0064]);
*/

//planecoords[0][0] and planecoords[0][1] is first set of coordinates
//planecoords[1][0] and planecoords[1][0] is the second set
//...

// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = 

//REFRESHMAP
//Passed planecoords, or make an api query? where does it get token?
//*** must be passed in order
// RETURNS STATE
function refreshmap(planecoords){

	if (planecoords.length == 0){
		return;
	}

	myLat = 0;
	myLng = 0;
	myLoc = new google.maps.LatLng(0,0);
	request = new XMLHttpRequest();
	map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);

	rotateangle = 0;
	polyline = [];
	markers = [];
	var newMarker;
	for (var i = 0; i < planecoords.length; i++){
		coords = new google.maps.LatLng(planecoords[i][0], planecoords[i][1]);
		polyline.push(coords);	
	}

	if (planecoords.length == 1){
		var picurl = "img/planesmall3.png";
		newMarker = new google.maps.Marker({		
			position: coords,
			icon: picurl
		});	
		newMarker.setMap(map);
		map.setCenter(coords);
	}
	else if (planecoords.length > 1){
		rotateangle = 0;
		for (var i = 0; i < polyline.length; i++){
			if (i > 0){
				var pastcoords = polyline[i-1];
				var curcoords = polyline[i];
				rotateangle = google.maps.geometry.spherical.computeHeading(pastcoords,curcoords);
				if (rotateangle < 0){
					rotateangle = 360 - (rotateangle * -1);
				}	
			}		
		}
			
		//now rotateangle is the angle of the final set of coordinates (current location)
		//figure out which degrees-turned-image matches the direction it's traveled since the last set of coords
		var picangle = 0;
		if (rotateangle >= 10 && rotateangle < 30) picangle = 20;
		else if (rotateangle >= 30 && rotateangle < 50) picangle = 40;
		else if (rotateangle >= 50 && rotateangle < 70) picangle = 60;		
		else if (rotateangle >= 70 && rotateangle < 90) picangle = 80;		
		else if (rotateangle >= 90 && rotateangle < 110) picangle = 100;		
		else if (rotateangle >= 110 && rotateangle < 130) picangle = 120;
		else if (rotateangle >= 130 && rotateangle < 150) picangle = 140;				
		else if (rotateangle >= 150 && rotateangle < 170) picangle = 160;
		else if (rotateangle >= 170 && rotateangle < 190) picangle = 180;								
		else if (rotateangle >= 190 && rotateangle < 210) picangle = 200;		
		else if (rotateangle >= 210 && rotateangle < 230) picangle = 220;		
		else if (rotateangle >= 230 && rotateangle < 250) picangle = 240;		
		else if (rotateangle >= 250 && rotateangle < 270) picangle = 260;
		else if (rotateangle >= 270 && rotateangle < 290) picangle = 280;
		else if (rotateangle >= 290 && rotateangle < 310) picangle = 300;
		else if (rotateangle >= 310 && rotateangle < 330) picangle = 320;
		else if (rotateangle >= 330 && rotateangle < 350) picangle = 340;
		else picangle = 0; // >= 350 || < 10
		
		var picurl = "img/angled/" + picangle + ".png";	
		
		var planepic = new google.maps.MarkerImage(
			picurl, 
			null,
			new google.maps.Point(0,0),
			new google.maps.Point(22, 22)
		);	
		newMarker = new google.maps.Marker({		
			position: coords,
			icon: planepic
		});	
	
		//draw final marker and polyline
		newMarker.setMap(map);
		drawlines(polyline);
		map.setCenter(coords);
	}


	var state = refreshfacts([coords.lat(), coords.lng()]); // pass final coords; the most recent coords
	return state;

}


// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = 


function drawlines(path){

	newline = new google.maps.Polyline({
			path: path,
			strokeColor: "#fbff00",
			strokeWeight: 4
		});
	newline.setMap(map);
}

// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = 

//REFRESHFACTS - finds facts for passed coords - update html
// facts have variable length - scrollbar on display of them or what?
function refreshfacts(coords){

//	console.log("refreshing at " + coords);

	var lat = coords[0];
	var lon = coords[1];

	url = "http://maps.googleapis.com/maps/api/geocode/json?latlng=" + lat + "," + lon + "&sensor=true";

	var state_simple = "unk";
	var state_regular = "reg";

    var request = new XMLHttpRequest();
	request.open("GET", url, true);
	request.send(null);
	request.onreadystatechange = function(){
		if (this.status == 0){
			console.log("status code 0");
		}
		else if (this.readyState == 4 && this.status == 200){			
			response = (this.responseText);
//			console.log(response);
			parsed_response = JSON.parse(response);
			if (parsed_response.status == "OK"){
				//search response for all states to identify which youre in
				var found = false;
				for (var i = 0; i < states_regular.length; i++){ //states in facts.js
					if (response.indexOf(states_regular[i]) != -1){
						state_regular = states_regular[i];
						state_simple = states_simple[i];
						found = true;
					}
				}
				if (found == false){
					if(response.indexOf("Canada") != -1){
						state_simple = "canada";
						state_regular = "Canada";
						found = true;
					}
				}
				if (found == false){
					state_simple = "ocean";
					state_regular = "Ocean";
				}
//				console.log("adding facts for " + state_regular);
					
				// now find facts for the state
				var fivefacts = findfacts(state_simple);

				// now delete past facts, then re-insert header, and facts
				// document.getElementById("facts").innerHTML = "";	
				$("#facts").empty();
				$("#facts").append("<h3>" + state_regular + " Facts</h3>");		
				for (var i = 0; i < fivefacts.length; i++){
					$("#facts").append("<p>" + (i+1) + ". " + fivefacts[i] + "</p>");
				}
			}
			else{
				state_simple = "ocean";
				state_regular = "Ocean";
			}
		}
	}
	return state_simple;	
		
	//load state polygons
	//loadpolygons();

}


// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = 


function findfacts(state_simple){
	
	var statefacts = facts[state_simple];
	statefacts.sort(randOrd);
	//Now the facts are randomly rearranged. Now we choose the first 5 and return them
	var fivefacts = [];
	for (var i = 0; i < 5; i++){
		fivefacts.push(statefacts[i]);
	}
	return fivefacts;

}

// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = 


function randOrd(){
	return (Math.round(Math.random())-0.5);
}

function fixbounds(){
	var bounds = new google.maps.LatLngBounds();
	if (polyline != undefined && polyline.length > 1){
		for (var i = 0; i < polyline.length; i++){
			bounds.extend(polyline[i]);
		}
		map.fitBounds(bounds);
	}
}

