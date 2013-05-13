var fieldscorner = new google.maps.LatLng(42.300093,-71.061667);
var myOptions = {
	zoom: 6, // The larger the zoom number, the bigger the zoom
	center: fieldscorner,	// center south station while your location loads
	mapTypeId: google.maps.MapTypeId.ROADMAP
	};
var map;
var myLat = 0;
var myLng = 0;
var myLoc = new google.maps.LatLng(0,0);
var request = new XMLHttpRequest();

// ========================================================================

// United Airlines 768 
// 42.76N, 80.45W at 3:58 PM est = 42.76, -80.45
// 42.78N, 79.71W at 4:03 PM est = 42.78, -79.71
// 42.8N, 78.2W at 4:09 PM est = 42.8, -78.2
// 42.8N, 77.21W at 4:14 PM est = 42.8, -77.21
// 42.79N, 76.11W at 4:21 PM est = 42.79, -76.11
// 42.78N, 75.36W at 4:25 PM est = 42.78, -75.36
// 42.76N, 74.22W at 4:30 PM est = 42.76, -74.22
// 42.68N, 73.12W at 4:38 PM est = 42.68, -73.13
// live data @ http://www.flightradar24.com/

test_plane1 = [];
test_plane1.push([42.76, -80.45]);
test_plane1.push([42.78, -79.71]);
test_plane1.push([42.8, -78.2]);
test_plane1.push([42.8, -77.21]);
test_plane1.push([42.79, -76.11]);
test_plane1.push([42.78, -75.36]);
test_plane1.push([42.76, -74.22]);
test_plane1.push([42.68, -73.12]);

function plane1(){
	plane = test_plane1;
	init();
}

// ========================================================================
//American Airlines 1885

test_plane2 = [];
test_plane2.push([30.2028, -97.6682]);	// 30.2028N, 97.6682W //austin airport
test_plane2.push([30.16, -97.75]);
test_plane2.push([30.66, -97.94]);
test_plane2.push([31.23, -98.07]);
test_plane2.push([31.78, -97.82]);
test_plane2.push([32.42, -97.53]);
test_plane2.push([32.7, -97.23]);
test_plane2.push([33.13, -97.13]);
test_plane2.push([32.8969, -97.0381]);

function plane2(){
	plane = test_plane2;
	init();
}

// ========================================================================

//Delta 818

test_plane3 = [];
test_plane3.push([44.88, -93.22]);
test_plane3.push([45.02, -93.14]);
test_plane3.push([45.31, -92.16]);
test_plane3.push([45.24, -90.96]);
test_plane3.push([45.18, -90.16]);
test_plane3.push([45.09, -89.13]);
test_plane3.push([45.01, -88.16]);
test_plane3.push([44.88, -86.94]);
test_plane3.push([44.75, -85.98]);
test_plane3.push([44.68, -85.17]);
test_plane3.push([44.53, -84.03]);
test_plane3.push([44.41, -83.15]);
test_plane3.push([44.17, -82.07]);
test_plane3.push([43.97, -81.12]);
test_plane3.push([43.77, -80.13]);
test_plane3.push([43.6, -79.2]);
test_plane3.push([43.47, -78.24]);
test_plane3.push([43.3, -77.2]);
test_plane3.push([43.19, -76.35]);
test_plane3.push([42.95, -75.36]);
test_plane3.push([42.77, -74.55]);
test_plane3.push([42.71, -73.44]);
test_plane3.push([42.65, -72.5]);
test_plane3.push([42.59, -72.18]);
test_plane3.push([42.52, -71.65]);
test_plane3.push([42.48, -71.34]);
test_plane3.push([42.45, -71.05]);
test_plane3.push([42.38, -70.9]);
test_plane3.push([42.33, -70.82]);
test_plane3.push([42.28, -70.83]);
test_plane3.push([42.27, -70.88]);
test_plane3.push([42.42, -70.93]);
test_plane3.push([42.33, -70.95]);
test_plane3.push([42.33, -70.97]);
test_plane3.push([42.35, -70.99]);
test_plane3.push([42.3631, -71.0064]);

function plane3(){
	plane = test_plane3;
	init();
}

// ========================================================================
var tally = 0;

function init(){
	map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);
	document.getElementById("locs").innerHTML="";
	draw_marker(0);
	tally = 0;
	count = 3;
	counter=setInterval(timer, 1000);
}

function timer(){
	count = count-1;
	if (count <= 0){
		clearInterval(counter);
//		console.log("reseting timer, updating plane coords");
		tally++;
		if (tally >= plane.length){
			document.getElementById("timer").innerHTML="COMPLETED ALL DATA POINTS";	
//			console.log("COMPLETED ALL DATA POINTS");
			return;
		}
		else{
			draw_marker(tally);
			count = 3;
			counter = setInterval(timer, 1000);
		}
	}
	document.getElementById("timer").innerHTML=count + " secs";	
}

function draw_marker(tally){

//	console.log(tally+1 + " of " + plane.length);

	myLat = plane[tally][0];
	myLon = plane[tally][1];
	
	planepic = 'images/planesmall3.png';	
	
	myLoc = new google.maps.LatLng(myLat, myLon);
	console.log("lolwat2");
	map.setCenter(myLoc);
	meMarker = new google.maps.Marker({
		position: myLoc,
		icon: planepic,
	});
	meMarker.setMap(map);	
	
//	console.log("detecting what state or country you're above...");
	find_state(myLoc);
}

function find_state(myLoc){
	
	var lat = myLoc.lat();
	var lon = myLoc.lng();
	
	url = "http://maps.googleapis.com/maps/api/geocode/json?latlng=" + lat + "," + lon + "&sensor=true";
//	console.log(url);
 
    var request = new XMLHttpRequest();
	request.open("GET", url, true);
	request.send(null);
	request.onreadystatechange = function(){
		try{
			if (this.status == 0){
				//console.log("status code 0");
			}
			else if (this.readyState == 4 && this.status == 200){
							
				response = (this.responseText);
				parsed_response = JSON.parse(response);
				var myAddress = [];
				var newLocation = "";
// very messy country and address location; google returns arrays of many possible addresses for each request... need to parse better				
				for (var i = 0; i < parsed_response.results.length; i++){
					var z = parsed_response.results[i].address_components;
					
					for (var k = 0; k < z.length; k++){
						var y = z[k];
						var x = y.long_name;
						if (x == "Canada"){
							newLocation = "Canada";
							document.getElementById("facts").innerHTML="<h3>Current facts:</h3><li>Cold</li><li>Maple Syrup</li><li>Lots of moose</li>";	
						}					
						else if (x == "United States"){
							newLocation = "United States";
							for (i = 0; i < parsed_response.results.length; i++) {
								myAddress[i] = parsed_response.results[i].formatted_address;
							}
							newLocation = "USA: " + myAddress[0];	
							document.getElementById("facts").innerHTML="<h3>Current facts:</h3><li>Lots of McDonalds</li><li>Lots of WalMarts</li>";														
						}
					}
				
				}
				document.getElementById("locs").innerHTML+="<li>" + newLocation;	
			}
		}
		catch(error) {
			alert(error);
		}
	}

}


function geo(){

	if (navigator.geolocation) {
		console.log("yes1");
		plane1();
		navigator.geolocation.getCurrentPosition(function(position) {
			console.log("yes");
			geolat = position.coords.latitude;
			geolng = position.coords.longitude;
			geoloc = position.coords.latitude;
			
			myLoc = new google.maps.LatLng(geolat,geolng);
			console.log("lolwat3");
			map.setCenter(myLoc);
			
			meMarker = new google.maps.Marker({
				position: myLoc,
			});
			var infowindow = new google.maps.InfoWindow({
				content: "<h3>You are here!</h3>",
			});
			google.maps.event.addListener(meMarker, 'click', function() {
				infowindow.setContent(meMarker.title);			
				infowindow.open(map, meMarker);	
			});
			meMarker.setMap(map);
			infowindow.open(map,meMarker);
			
			
//			content = findClosest(); //finds closest station (requires geolocation to be loaded)
//			centerMe(content); //centers you on map and adds marker for you
//			findCharacters(); //parses for chars, gives them markers, calculates distance
		});	
	}
	else {
		alert("Geolocation not supported");
	}
}
