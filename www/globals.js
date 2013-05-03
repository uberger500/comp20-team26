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

$(document).ready(function() {
	var callct = 0;

	function User(email, password) {
		this.attempt = false;
		this.email = email.toString();
		this.password = password.toString();
		return this.update();
	}

	function createUser(name, email, password) {
		$.post("http://wingmanapi.herokuapp.com/api/user/create", { name: name, email: email, password: password }).done(function(data) {
			if (data.success) {
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
	 		console.log(data);
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
	 	});
	 	return this;
	};

	User.prototype.loginSuccess = function() {
		if (!callct)
			reload = setInterval(getLastTenLines, 500);
		$(".before-login").animate({width: "hide", height: "hide"}, 200);
		$(".after-login").fadeIn("slow");
		$(".drop-down").fadeIn("slow");
		reload = setInterval(getLastTenLines, 500);
		google.maps.event.trigger(map, 'resize');
		return this;
	};

	// Load saved user if there is one
	if (localStorage.savedUser) {
		var saved = JSON.parse(localStorage.savedUser);
		if (saved) {
			logged_user = new User(saved.email, saved.password);
		}
	}

	refreshmap(planecoords);
	start_game();

	$("#snake-button").on("click", function(e) {
		initializeSnake();
		$("#snake-board").focus();
	});

	if (!logged_user) {
		$(".drop-down").hide();
	}

	function Graph() {
		return this;
	}

	Graph.prototype.addNode = function() {
		return this;
	};

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


	function submitChat()
	{
	    chatmsg = encodeHTML(document.getElementById("msg").value);
	    document.getElementById("msg").value = "";
	    // Use the global user's username
	    // http://wingmanapi.herokuapp.com/api/chat/submit
	    $.post("http://wingmanapi.herokuapp.com/api/chat/submit", {username: logged_user.email, chatline: chatmsg, token: logged_user.token});  
	}
	var chat_calls = 0;
	function getLastTenLines() {
	    var request = new XMLHttpRequest();
		request.open("GET", "http://wingmanapi.herokuapp.com/api/chat/chatlines?token=" + logged_user.token, true);
		request.send(null);
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
});