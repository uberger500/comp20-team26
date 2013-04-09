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

//x0 = [42.75, -80.45];
x0 = [42.76, -80.45];
x1 = [42.78, -79.71];
x2 = [42.8, -78.2];
x3 = [42.8, -77.21];
x4 = [42.79, -76.11];
x5 = [42.78, -75.36];
x6 = [42.76, -74.22];
x7 = [42.68, -73.12];

test_plane = [x0, x1, x2, x3, x4, x5, x6, x7];
//test_plane = [x6];

var tally = 0;

function init(){
	map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);

	draw_marker(0);

	count = 5;
	counter=setInterval(timer, 1000);
}

function timer(){
	count = count-1;
	if (count <= 0){
		clearInterval(counter);
		console.log("reseting timer, updating plane coords");
		tally++;
		if (tally >= test_plane.length){
			document.getElementById("timer").innerHTML="COMPLETED ALL DATA POINTS";	
			console.log("COMPLETED ALL DATA POINTS");
			return;
		}
		else{
			draw_marker(tally);
			count = 5;
			counter = setInterval(timer, 1000);
		}
	}
	document.getElementById("timer").innerHTML=count + " secs";	
}

function draw_marker(tally){

	console.log(tally+1 + " of " + test_plane.length);

	myLat = test_plane[tally][0];
	myLon = test_plane[tally][1];
	
	plane = 'planesmall.png';	
	
	myLoc = new google.maps.LatLng(myLat, myLon);
	map.setCenter(myLoc);
	meMarker = new google.maps.Marker({
		position: myLoc,
		icon: plane,
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
						}					
						else if (x == "United States"){
							newLocation = "United States";
							for (i = 0; i < parsed_response.results.length; i++) {
								myAddress[i] = parsed_response.results[i].formatted_address;
							}
							newLocation = "USA: " + myAddress[0];							
						}
					}
				
				}
				document.getElementById("leftbox").innerHTML+="<li>" + newLocation;	
			}
		}
		catch(error) {
			alert(error);
		}
	}

}

