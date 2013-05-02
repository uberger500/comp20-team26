var fieldscorner = new google.maps.LatLng(42.300093,-71.061667);
var myOptions = {
	zoom: 6, // The larger the zoom number, the bigger the zoom
	center: fieldscorner,	// center south station while your location loads
	mapTypeId: google.maps.MapTypeId.HYBRID
	};
var map;
var myLat = 0;
var myLng = 0;
var myLoc = new google.maps.LatLng(0,0);
var request = new XMLHttpRequest();

// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = 

function geo(){ //draw the map
	map = new google.maps.Map(document.getElementById("map_canvas"), myOptions); 
}

// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = 

function findnearbyplanes(){

	if (navigator.geolocation) {
		document.getElementById("status").innerHTML = "Attempting geolocation <br/>";
		navigator.geolocation.getCurrentPosition(function(position) {
			document.getElementById("status").innerHTML += "Found you<br/>";
			geolat = position.coords.latitude;
			geolng = position.coords.longitude;
			geoloc = position.coords.latitude;
			
			myLoc = new google.maps.LatLng(geolat,geolng);
			map.setCenter(myLoc);
			meMarker = new google.maps.Marker({
				position: myLoc,
			});
			meMarker.setMap(map);

			// now search for nearby planes, sending longitude and latitude as args
			// to a get request that respons with json planes
			
			//change this to wingmanapi.herokuapp whatever
			var url = "http://localhost:5000/api/nearbyplanes?latitude=" + myLoc.lat() + "&longitude=" + myLoc.lng() + "&token=7cb2c74a-f4ec-4691-a92b-540366f0db87";
			
			$.get(url, function(data){ 
				// data comes back as an array of flight strings
				if (JSON.stringify(data).indexOf('flight') == -1){ //if theres no substring flight, no flights found
				//if (data == "{'error1'}" || data == "{'error2'}" || data == "{'error3'}" || data == "{'error4'}" || data == "[]" || data == "[ ]"){
					document.getElementById("status").innerHTML += "Cound not find any flights around you";
//					alert(data);
				}
				else{
					// now split results into array of strings of flights
					jsondata = JSON.parse(data);
						
					// now remove duplicate flights from the list; they sometimes show up twice
					cleanjsondata = [];
					$.each(jsondata, function(i, el){
						if($.inArray(el, cleanjsondata) === -1) cleanjsondata.push(el);
					});

					document.getElementById("status").innerHTML += "These planes are near you: <br/>";
					
					//put all nearby planes in a drop down form
					formstring = "<form action=''><select name='flights'>";
					for (var j = 0; j < cleanjsondata.length; j++){
						var formoption = "<option value = '" + cleanjsondata[j] + "'>" + cleanjsondata[j] + "</option>";     
						formstring += formoption;
					}
					formstring += "</select></form>";
					document.getElementById("status").innerHTML += formstring;
					
				}
			});			
		});	
	}
	else {
		document.getElementById("status").innerHTML = "Geolocation not supported";
	}
}

// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = 
