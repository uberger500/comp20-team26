$(document).ready(function() { 
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
	}

	User.prototype.loginSuccess = function() {
		$("#login-form").slideUp("fast");
		$("#create-form").slideUp("fast");
		$("#lander").animate({width: "hide", height: "hide"}, 200);
		return this;
	}

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
	}

	$("#log-in").on("click", function(e) {
		e.preventDefault();
		var pass = $("#password").val();
		var email = $("#email-address").val();	
		if (pass == "" || email == "") return;
		logged_user = new User(email,pass);
		var checkUser = window.setInterval(function() {
			if (logged_user.attempt == true)
				logged_user.update();
			else window.clearInterval(checkUser);
		}, 3000);
	})
});