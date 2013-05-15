function displaynearbyplanes(){
	document.getElementById("nearbyplanes").innerHTML = "";
	document.getElementById("nearbyplanes").innerHTML += "<img src = 'img/loading2.gif' alt = loading'> &nbsp;&nbsp; Attempting geolocation...<br/><br/>";

	if (navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(function(position) {
			geolat = position.coords.latitude;
			geolng = position.coords.longitude;
			geoloc = position.coords.latitude;
			
			myLoc = new google.maps.LatLng(geolat,geolng);
//			map.setCenter(myLoc);
			meMarker = new google.maps.Marker({
				position: myLoc,
			});
//			meMarker.setMap(map);

			// now search for nearby planes, sending longitude and latitude as args
			// to a get request that respons with json planes
			
			//change this to wingmanapi.herokuapp whatever
			var url = "http://127.0.0.1:5000/api/nearbyplanes?latitude=" + myLoc.lat() + "&longitude=" + myLoc.lng() + "&token=" + logged_user.token;
			// console.log(url);
			$.get(url, function(data){ 
				// data comes back as an array of flight strings
				if (JSON.stringify(data).indexOf('flight') == -1){ //if theres no substring flight, no flights found
					document.getElementById("nearbyplanes").innerHTML = "";
					document.getElementById("nearbyplanes").innerHTML += "Nearby planes not currently available by Wolfram<br/><br/>";
				}
				else{
					// now split results into array of strings of flights
					jsondata = data;
						
					// now remove duplicate flights from the list; they sometimes show up twice
					cleanjsondata = [];
					$.each(jsondata, function(i, el){
						if($.inArray(el, cleanjsondata) === -1) cleanjsondata.push(el);
					});
					
					pluralplanes = "";
					if (cleanjsondata.length > 1){	//if multiple planes found, say "planes found" instead of "plane found"
						pluralplanes = "s";
					}
					
					document.getElementById("nearbyplanes").innerHTML = "";
					document.getElementById("nearbyplanes").innerHTML += "<img src = 'img/loading2.gif' alt = loading'> &nbsp;&nbsp;Found " + cleanjsondata.length + " plane" + pluralplanes +" near you. Checking which planes wolfram has data on...<br/><br/>";
					
					//put all nearby planes in a drop down form
					
					formstring = "Valid flights found:<br/><form action=''><select id = 'planedropdown' onchange = 'alertme()'><option value = ''>-- Select a flight --</option>";
										
					for (var j = 0; j < cleanjsondata.length; j++){							
						var flight = cleanjsondata[j];
						if (flight.indexOf("Delta") != -1){
							flight = flight.replace(" Air Lines ", " "); //querying delta+air+lines+flight+# doesnt work for some reason
						}
						
						var numfound = cleanjsondata.length;
						var numverified = 0;
						
						var flightpluses = flight.replace(/ /g, "+");
						var url = "http://127.0.0.1:5000/api/checkflight?flight=" + flightpluses + "&token=" + logged_user.token;
						//check if all flights are valid on wolfram and are either en route or havent taken off yet; landeds will not be returned
						$.ajax({
							url: url,
							type: 'GET',
							success: function(response){
								if (response.status == "valid" || response.status == "has not taken off yet"){
									var formoption = "<option value = '" + response.plane + "'>" + response.plane + "</option>";     
									formstring += formoption;
								}
								numverified++;
								if (numverified == numfound){
									// finish the form and push it if this is the final plane found and the request is done
									formstring += "</select></form>";
									document.getElementById("nearbyplanes").innerHTML = formstring;
								}							
							},
							error: function (error){
								numverified++;
								if (numverified == numfound){
									// finish the form and push it if this is the final plane found and the request is done
									formstring += "</select></form>";
									document.getElementById("nearbyplanes").innerHTML = formstring;
								}
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

function submitflight(){
	
	//disable user re-clicking it
	$('#submit-flight').attr('disabled', 'disabled').addClass('disabled');

	var flightnum = $("#flight-number").val();

	if (flightnum === "") {
		e.preventDefault();
		return;
	}
	
	//check if valid on wolfram
	var flightpluses = flightnum.replace(/ /g, "+");
	var url = "http://127.0.0.1:5000/api/checkflight?flight=" + flightpluses + "&token=" + logged_user.token;
	//check if all flights are valid on wolfram and are either en route or havent taken off yet; landeds will not be returned
	$.get(url, function(response){ 
		if (response.status == "valid" || response.status == "has not taken off yet"){
			if (response.status == "has not taken off yet"){
				alert("Valid flight but either hasn't taken off yet or no post-takeoff data available yet; there may be a delay in tracking.");
			}
			
			//add flight to database
			$.post("http://127.0.0.1:5000/api/user/addflight", {username: logged_user.email, token: logged_user.token, flight: flightnum});

	
			logged_user.Set("flightnum",flightnum);
			logged_user.updateFlight();
			flightupdate = window.setInterval(logged_user.updateFlight, 20000);
			//fix map rendering zoom
//			fixbounds();
			$("#input-flight").hide();
			$("#trigger-input").trigger("click");
			$('#submit-flight').removeAttr('disabled');		
			$('#submit-flight').removeClass('btn btn-success disabled');	
			$('#submit-flight').addClass('btn btn-success');
			$('#nearbyplanesbut').removeAttr('disabled').removeClass('ui-state-disabled'); //re-enable find flights button
			}
		else{
			alert("Invalid flight number, please try again. Make sure you use the correct format if inputting directly. Some flight data unavailable.");
			$('#submit-flight').removeAttr('disabled');		
			$('#submit-flight').removeClass('btn btn-success disabled');	//^v re-enable go button
			$('#submit-flight').addClass('btn btn-success'); 
		}
	});
}