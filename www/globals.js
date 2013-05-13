var searchingforchats = false;
var chatinterval = "empty";
var reload2;
var reload1;
olddata = 'a';

function encodeHTML(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

function initializeSnake() {
	var mySnakeBoard = new SNAKE.Board({
		boardContainer: "snake-board",
		fullScreen: false,
		width: 500,
		height: 500
	});
}

function logoutUser() {
	$.post("http://wingmanapi.herokuapp.com/api/user/logout", {token: logged_user.token}, function(data) {
		if (data.success) {
			localStorage.savedUser = null;
			window.location.reload();
		}
	});
}

$(document).ready(function() {
	var callct = 0;

	function User(email, password) {
		this.attempt = false;
		this.email = email.toString();
		this.currentFlight = [];
		this.password = password.toString();
		return this.update();
	}

	User.prototype.placeLoc = function() {
//		var len = this.currentFlight.length - 1;
//		var lat = this.currentFlight[len].latitude;
//		var lon = this.currentFlight[len].longitude;
//		var coords = new google.maps.LatLng(lat,lon);
//		var location = new google.maps.Marker({
//			position: coords
//		});
//		location.setMap(null);
//		location.setMap(map);
//		map.setCenter(coords);
//		refreshfacts(coords);
	};

	User.prototype.Set = function(prop, val) {
		this[prop] = val;
	};

	User.prototype.Get = function(prop) {
		return this[prop];
	};

	User.prototype.populateFields = function() {
		$("#username-p").html(this.name);
		$("#flights-p").html(this.total_flights + "3");
		$("#miles-p").html(this.total_miles + "3247");
	};

	function createUser(name, email, password) {
		var name2 = encodeHTML(name);
		var email2 = encodeHTML(email);
		var password2 = encodeHTML(password);
		if (name == name2 && email == email2 && password == password2){
			$.post("http://wingmanapi.herokuapp.com/api/user/create", { name: name, email: email, password: password }).done(function(data) {
				if (data.success) {
					//send email
					$.ajax({
						 type: "POST",
						 url: "http://planaheadonline.com/sendmail.php",
						 data: "address=" + email + "&title=" + "WingMan Registration" + "&name=" + name + "&mail=" + "WingManNoReply@gmail.com" + "&message=" + "Welcome!",
					});
					alert("Thanks " + name + ", you've created an account!");
					//login with their info automatically
					logged_user = new User(email2,password2);
	
					var checkUser = window.setInterval(function() {
					if (logged_user.attempt === true)
						logged_user.update();
					else window.clearInterval(checkUser);
					}, 3000);	
					
					$("#creater").hide();
				} else {
					alert("Sorry, the email " + email + " is already in use!");
				}
				//$("#trigger-input").trigger("click");				
			});
		}
		else{
			alert("Invalid name, email, or password");
		}
	}

	User.prototype.update = function() {
		var that = this;
		localStorage.savedUser = JSON.stringify(that);
	 	$.post("http://wingmanapi.herokuapp.com/api/user/login",
	 	   {
	 	   		email: this.email,
	 	   		password: this.password
	 	   }
	 	).done(function(data) {
	 		$.extend(true,logged_user,data.user);
	 		logged_user.token = data.token;
	 		if (data.success === false){ 
	 			callct = 0;
	 			that.attempt = false;
	 			return;
	 		}
	 		that.loginSuccess();
	 		callct++;
	 		that.attempt = true;
	 		that.populateFields();
	 	});
	 	return this;
	};

	User.prototype.loginSuccess = function() {
		if (!callct){
//			if (searchingforchats == true){
//				console.log("reload1");
//				if (reload1){
//					clearInterval(reload1);
//				}
//				reload1 = window.setInterval(getLastTenLines, 1000);
//			}
			$("#trigger-input").trigger("click");
		}
		$(".before-login").animate({height: "hide"}, 400);
		$(".after-login").fadeIn("slow");
		$(".drop-down").fadeIn("slow");
		if (searchingforchats == true){
			if (reload2){
				clearInterval(reload2);
			}
			reload2 = window.setInterval(getLastTenLines, 1000);
		}

		google.maps.event.trigger(map, 'resize');
		return this;
	};

	User.prototype.updateFlight = function() {
		var that = this;
		$.get("http://wingmanapi.herokuapp.com/api/currentdata", {
			flight: logged_user.Get("flightnum"),
//			token: "7cb2c74a-f4ec-4691-a92b-540366f0db87"
			token: logged_user.token
		}, function(data) {
		
			//send new info to database for given flight
			$.post("http://wingmanapi.herokuapp.com/api/user/update", {
				flight: logged_user.Get("flightnum"),
				token: logged_user.token,
				latitude: data.latitude,
				longitude: data.longitude
			});
		
		
			//now grab all coordinates, make markers, and put on map with polyline
			$.get("http://wingmanapi.herokuapp.com/api/user/pathcoords", {
				flight: logged_user.Get("flightnum"),
				token: logged_user.token
			}, function(data){
				datastr = JSON.stringify(data);
				if (datastr != olddata){
					refreshmap(data);
					olddata = datastr;
				}
			});
			


			if (typeof data.altitude !== "undefined") {
				logged_user.currentFlight.push(data);
				logged_user.placeLoc();
			}
			var alt = [], spd = [];
			var altChart = new JSChart('chartcontainer2', 'line');
			var spdChart = new JSChart('chartcontainer', 'line');
			var speed = new Array();
			if (logged_user.currentFlight.length < 4)
				return;
			for (var i = 0; i < logged_user.currentFlight.length; i++) {
				alt.push([i,parseInt(logged_user.currentFlight[i].altitude) ]);
				spd.push([i,parseInt(logged_user.currentFlight[i].speed) ]);
			}
			altChart.setDataArray(alt);
			altChart.draw();
			spdChart.setDataArray(spd);
			spdChart.draw();
		});
	};

	// Load saved user if there is one
	if (localStorage.savedUser) {
		var saved = JSON.parse(localStorage.savedUser);
		if (saved) {
			logged_user = new User(saved.email, saved.password);
			callct = 0;
			var checkUser = window.setInterval(function() {
			if (logged_user.attempt === true)
				logged_user.update();
			else window.clearInterval(checkUser);
			}, 3000);
		}
	}

	map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);
	var middleUSA = new google.maps.LatLng(39.8282, -98.5795);
//	console.log("setting to middle usa");
	map.setCenter(middleUSA);

	
//	refreshmap([[39.8282, -98.5795]]);
	start_game();
		

	$("#snake-button").on("click", function(e) {
		initializeSnake();
		$("#snake-board").focus();
	});


	$("#log-in").on("click", function(e) {
		e.preventDefault();
		var pass = $("#password").val();
		var email = $("#email-address").val();
		if (pass === "" || email === "") return;
		logged_user = new User(email,pass);
		callct = 0;
		// var checkUser = window.setInterval(function() {
		// 	if (logged_user.attempt === true)
		// 		logged_user.update();
		// 	else window.clearInterval(checkUser);
		// }, 3000);
	});

	$("#create-user").on("click", function(e) {
		e.preventDefault();
		var pass = $("#create-password").val();
		var email = $("#create-email").val();
		var name = $("#create-name").val();
		if (pass === "" || email === "" || name === "") return;
		createUser(name.toString(), email.toString(), pass.toString());
	});

	$("#msg").on("keydown", function(e) {
		if (e.which == 13) {
			submitChat();
		}

		$("#plane-chat").removeClass("closed-chat");
	}).on("focus", function() {
		searchingforchats = true;
		getLastTenLines();
		$("#plane-chat").removeClass("closed-chat");
	});

	$(".close-chat-btn").on("click", function() {
		var $t = $(this);
		searchingforchats = false;
		clearInterval(reload2); //turn off chat request interval
		$t.parent().addClass("closed-chat");
	});



// INSERT LOADING GIF HERE NEXT TWO POSSIBLE SUBMITS?
	$("#flight-number").on("keydown", function(e) {
		if (e.which == 13) {
			submitflight();

		}
	});

	$("#submit-flight").on("click", function(e) {
		submitflight();
	});


	// chat api 
	function submitChat()
	{
		chatmsg = encodeHTML(document.getElementById("msg").value);
		document.getElementById("msg").value = "";
		$.post("http://wingmanapi.herokuapp.com/api/chat/submit", {username: logged_user.email, chatline: chatmsg, token: logged_user.token});
	}

	var chat_calls = 0;
	function getLastTenLines() {
		$.get("http://wingmanapi.herokuapp.com/api/chat/chatlines?token=" + logged_user.token, function(data) {
			parsed_response = data;
			elem = document.getElementById("chatlines");
	        output = "";
	    	for (chatline in parsed_response) {
	    		if (typeof parsed_response[chatline].username === "undefined")
	    			continue;
				output = output + "<p>" + parsed_response[chatline].username +": " + parsed_response[chatline].chatline + "</p>\n";
			}
			elem.innerHTML = output;
			if (!chat_calls)
				$('#chatlines').scrollTop($('#chatlines')[0].scrollHeight);
			chat_calls++;
		});
	}

	//tabbing functionality for dashboard
	$(".tabs").find("li").on("click", function() {
		$(".opener").hide();
		var $t = $(this);
		var $g = $("#" + $t.parent().data().group);
		var $link = $("[data-tabname=" + $t.attr("rel") + "]");
		if ($t.hasClass("slider")) return;
		if ($link.hasClass("active-page")) return;
		$g.children().hide().removeClass("active-page");
		if (typeof $t.attr("rel") === "undefined") {
			var i = $t.index();
			$g.children().eq(i).fadeIn("fast").addClass("active-page");
		}
		$g.find("[data-tabname]").removeClass("active-page");
		if (typeof $t.data("transition") === "undefined")
			$link.slideDown("fast");
		else 
			$link.fadeIn("fast");
		$link.addClass("active-page");
		$t.addClass("selected-tab").siblings().removeClass("selected-tab");
	}).each(function() {
		var $t = $(this);
		if (!$t.index()) $t.addClass('selected-tab');
		var $g = $("#" + $t.parent().data('group'));
		$g.children(":gt(0)").hide();
		$g.children().first().addClass("active-page");
	});
});

function submitflight(){
	var flightnum = $("#flight-number").val();

	if (flightnum === "") {
		e.preventDefault();
		return;
	}
	
	//check if valid on wolfram
	var flightpluses = flightnum.replace(/ /g, "+");
	var url = "http://wingmanapi.herokuapp.com/api/checkflight?flight=" + flightpluses + "&token=" + logged_user.token;
	//check if all flights are valid on wolfram and are either en route or havent taken off yet; landeds will not be returned
	$.get(url, function(response){ 
		if (response.status == "valid" || response.status == "has not taken off yet"){
			if (response.status == "has not taken off yet"){
				alert("Valid flight but either hasn't taken off yet or no post-takeoff data available yet; there may be a delay in tracking.");
			}
			
			//add flight to database
			$.post("http://wingmanapi.herokuapp.com/api/user/addflight", {username: logged_user.email, token: logged_user.token, flight: flightnum});

	
			logged_user.Set("flightnum",flightnum);
			logged_user.updateFlight();
			flightupdate = window.setInterval(logged_user.updateFlight, 20000);
			//fix map rendering zoom
//			fixbounds();
			$("#input-flight").hide();
			$("#trigger-input").trigger("click");
		}
		else{
			alert("Invalid flight number, please try again. Make sure you use the correct format if inputting directly. Some flight data unavailable.");
		}
	});
}