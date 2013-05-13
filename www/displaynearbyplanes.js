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
			var url = "http://wingmanapi.herokuapp.com/api/nearbyplanes?latitude=" + myLoc.lat() + "&longitude=" + myLoc.lng() + "&token=" + logged_user.token;
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
					document.getElementById("nearbyplanes").innerHTML = "";
					document.getElementById("nearbyplanes").innerHTML += "Found " + cleanjsondata.length + " planes near you. Checking which planes wolfram has data on...<br/><br/>";
					
					//put all nearby planes in a drop down form
					
					formstring = "Valid flights found:<br/><form action=''><select id = 'planedropdown' onchange = 'alertme()'><option value = ''>-- Select a flight --</option>";
										
					for (var j = 0; j < cleanjsondata.length; j++){
						
												
						var flight = cleanjsondata[j];

						console.log("checking " + flight);

						
						if (flight.indexOf("Delta") != -1){
							flight = flight.replace(" Air Lines ", " "); //querying delta+air+lines+flight+# doesnt work for some reason
						}
						
						var numfound = cleanjsondata.length;
						var numverified = 0;
						
						
						var flightpluses = flight.replace(/ /g, "+");
						var url = "http://wingmanapi.herokuapp.com/api/checkflight?flight=" + flightpluses + "&token=" + logged_user.token;
						//check if all flights are valid on wolfram and are either en route or havent taken off yet; landeds will not be returned
						$.get(url, function(response){ 
							//else try removing airlines and air lines and airways whatever? formatting weird with delta etc --> extra requests, slow
						}).done(function(response){
							console.log(" full response " + JSON.stringify(response));
							if (response.status == "valid" || response.status == "has not taken off yet"){
								var formoption = "<option value = '" + response.plane + "'>" + response.plane + "</option>";     
								formstring += formoption;
							}
							numverified++;
							
							//CHANGE THIS
							
							if (numverified == numfound){
								console.log("ALL VERIFIED, pushing form");
								// finish the form and push it if this is the final plane found and the request is done
								formstring += "</select></form>";
								document.getElementById("nearbyplanes").innerHTML = formstring;
							}
						});
					}
				}
			});
			
		});
	}
	else document.getElementById("nearbyplanes").innerHTML = "Geolocation not supported";
}

function alertme(){
	$("#flight-number").val(document.getElementById('planedropdown').value);
}