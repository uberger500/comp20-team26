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

// function speedGraph(){
	// var myData = new Array([10, 20], [15, 10], [20, 30], [25, 10], [30, 5]);
	// var myChart = new JSChart('chartcontainer', 'line');
	// myChart.setDataArray(myData);
	// myChart.draw();
// }

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
		var len = this.currentFlight.length - 1;
		var lat = this.currentFlight[len].latitude;
		var lon = this.currentFlight[len].longitude;
		var coords = new google.maps.LatLng(lat,lon);
		var location = new google.maps.Marker({		
			position: coords
		});
		location.setMap(null);
		location.setMap(map);
		map.setCenter(coords);
	}

	User.prototype.Set = function(prop, val) {
		this[prop] = val;
	}

	User.prototype.Get = function(prop) {
		return this[prop];
	}

	User.prototype.populateFields = function() {
		$("#username-p").html(this.name);
		$("#flights-p").html(this.total_flights);
		$("#miles-p").html(this.total_miles + "3247");
	};

	function createUser(name, email, password) {
		$.post("http://wingmanapi.herokuapp.com/api/user/create", { name: name, email: email, password: password }).done(function(data) {
			if (data.success) {
				//send email
				$.ajax({
					 type: "POST",
					 url: "http://wingmanapi.herokuapp.com/sendmail.php",
					 data: "address=" + email + "&title=" + "WingMan Registration" + "&name=" + name + "&mail=" + "WingManNoReply@gmail.com" + "&message=" + "Welcome!",
				});
				alert("Thanks " + name + ", you've created an account!");
			} else {
				alert("Sorry, the email " + email + " is already in use!");
			}
		});
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
	 		console.log(logged_user);
	 		that.loginSuccess();
	 		callct++;
	 		that.attempt = true;
	 		that.populateFields();
	 	});
	 	return this;
	};

	User.prototype.loginSuccess = function() {
		if (!callct){
			reload = window.setInterval(getLastTenLines, 500);
			$("#trigger-input").trigger("click");
		}
		$(".before-login").animate({width: "hide", height: "hide"}, 200);
		$(".after-login").fadeIn("slow");
		$(".drop-down").fadeIn("slow");
		reload = setInterval(getLastTenLines, 500);
		google.maps.event.trigger(map, 'resize');
		return this;
	};

	User.prototype.updateFlight = function() {
		var that = this;
		console.log(logged_user.flightnum);
		$.get("http://wingmanapi.herokuapp.com/api/currentdata", {
			flight: logged_user.Get("flightnum"),
			token: logged_user.token
		}, function(data) {
			console.log(data);
			if (typeof data.altitude !== "undefined") {
				logged_user.currentFlight.push(data);
				logged_user.placeLoc();
			}
		});
	};

	// Load saved user if there is one
	if (localStorage.savedUser) {
		var saved = JSON.parse(localStorage.savedUser);
		if (saved) {
			logged_user = new User(saved.email, saved.password);
			callct = 0;
			var checkUser = window.setInterval(function() {
				console.log("set");
			if (logged_user.attempt === true)
				logged_user.update();
			else window.clearInterval(checkUser);
			}, 3000);
		}
	}

	refreshmap(planecoords);
	start_game();

	$("#log-in").on("click", function(e) {
		e.preventDefault();
		var pass = $("#password").val();
		var email = $("#email-address").val();
		if (pass === "" || email === "") return;
		logged_user = new User(email,pass);
		callct = 0;
		var checkUser = window.setInterval(function() {
			if (logged_user.attempt === true)
				logged_user.update();
			else window.clearInterval(checkUser);
		}, 3000);
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
		$("#plane-chat").removeClass("closed-chat");
	});

	$(".close-chat-btn").on("click", function() {
		var $t = $(this);
		$t.parent().addClass("closed-chat");
	});

	$("#submit-flight").on("click", function(e) {
		var flightnum = $("#flight-number").val();
		if (flightnum === "") {
			e.preventDefault();
			return;
		}
		logged_user.Set("flightnum",flightnum);
		logged_user.updateFlight();
		flightupdate = window.setInterval(logged_user.updateFlight, 20000);
		//fix map rendering zoom
		fixbounds();
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
	    var request = new XMLHttpRequest();
		request.open("GET", "http://wingmanapi.herokuapp.com/api/chat/chatlines?token=" + logged_user.token, true);
		//request.send(null);
		request.onreadystatechange = function(){
			try{
				if (this.readyState ==4 && this.status == 0){
				console.log("status code 0");
				throw "noresponse";
				}
				else if (this.readyState == 4 && this.status == 200){				
					response = (this.responseText);
					parsed_response = JSON.parse(response);
					elem=document.getElementById("chatlines");
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
				}
			}				
			catch(error) {
	        	if (error == "noresponse") {
	            	console.log("no chat info returned");
	        	}
	    	}
		}
	}

	//tabbing functionality for dashboard
	$(".tabs").find("li").on("click", function() {
		$(".opener").hide();
		var $t = $(this);
		var $g = $("#" + $t.parent().data().group);
		var $link = $("[data-tabname=" + $t.attr("rel") + "]");
		if ($t.hasClass("slider")) return;
		if ($link.hasClass("active-page")) return;
		// console.log($g);
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