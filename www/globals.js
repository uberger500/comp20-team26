function encodeHTML(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
};

$(document).ready(function() { 
	var reload = null;

	function createUser(name, email, password) {
		$.post("http://127.0.0.1:5000/api/user/create", { name: name, email: email, password: password }).done(function(data) {
			if (data.success) {
				alert("Thanks " + name + ", you've created an account!");
			} else {
				alert("Sorry, the email " + email + " is already in use!");
			}
		});
	}

	User.prototype.update = function() {
		var that = this;
	 	$.post("http://wingmanapi.herokuapp.com/api/user/login",
	 	   {
	 	   		email: this.email,
	 	   		password: this.password
	 	   }
	 	).done(function(data) {
	 		console.log(data.success);
	 		$.extend(true,logged_user,data.user);
	 		if (data.success === false){
	 			that.attempt = false;
	 			return;
	 		}
	 		that.loginSuccess();
	 		that.attempt = true;
	 	});
	 	return this;
	};

	User.prototype.loginSuccess = function() {
		$(".before-login").animate({width: "hide", height: "hide"}, 200);
		$(".after-login").fadeIn("slow");
		reload = setInterval(getLastTenLines, 500);
		return this;
	};

	function User(email, password) {
		this.attempt = false;
		this.email = email;
		this.password = password;
		return this.update();
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
		var checkUser = window.setInterval(function() {
			if (logged_user.attempt === true)
				logged_user.update();
			else window.clearInterval(checkUser);
		}, 3000);
	});

	$("#create-user").on("click", function(e) {
		e.preventDefault();
		var pass = $("#create-password").val();
		console.log(pass, pass.toString());
		var email = $("#create-email").val();
		var name = $("#create-name").val();
		if (pass === "" || email === "" || name === "") return;
		createUser(name.toString(), email.toString(), password.toString());
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

	var token = "1f9355c9-13cf-47af-bce8-f6a7fd47e160";

	function submitChat()
	{
		console.log("chatting");
	    chatmsg = encodeHTML(document.getElementById("msg").value);
	    document.getElementById("msg").value = "";
	    // Use the global user's username
	    // http://wingmanapi.herokuapp.com/api/chat/submit
	    $.post("http://127.0.0.1:5000/api/chat/submit", {username: "username", chatline: chatmsg, token: token});  
	}
	var chat_calls = 0;
	function getLastTenLines() {
	    var request = new XMLHttpRequest();
		request.open("GET", "http://127.0.0.1:5000/api/chat/chatlines?token=" + token, true);
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