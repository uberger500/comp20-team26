function displaynearbyplanes(){

	if (navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(function(position) {
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
			var url = "http://127.0.0.1:5000/api/nearbyplanes?latitude=" + myLoc.lat() + "&longitude=" + myLoc.lng() + "&token=" + logged_user.token;
			// console.log(url);
			$.get(url, function(data){ 
				// data comes back as an array of flight strings
				if (JSON.stringify(data).indexOf('flight') == -1){ //if theres no substring flight, no flights found
					document.getElementById("nearbyplanes").innerHTML += "Nearly planes not currently available by Wolfram<br/><br/>";
				}
				else{
					// now split results into array of strings of flights
					jsondata = data;
						
					// now remove duplicate flights from the list; they sometimes show up twice
					cleanjsondata = [];
					$.each(jsondata, function(i, el){
						if($.inArray(el, cleanjsondata) === -1) cleanjsondata.push(el);
					});

					document.getElementById("nearbyplanes").innerHTML += "These planes are near you: <br/>";
					
					//put all nearby planes in a drop down form
					formstring = "<form action=''><select id = 'planedropdown' onchange = 'alertme()'>";
					for (var j = 0; j < cleanjsondata.length; j++){
						var formoption = "<option value = '" + cleanjsondata[j] + "'>" + cleanjsondata[j] + "</option>";     
						formstring += formoption;
					}
					formstring += "</select></form>";
					document.getElementById("nearbyplanes").innerHTML += formstring;
					
				}
			}).done(function(data) {
				// console.log(data);
			});			
		});	
	}
	else {
		document.getElementById("status").innerHTML = "Geolocation not supported";
	}
}

function alertme(){
	$("#flight-number").val(document.getElementById('planedropdown').value);
}