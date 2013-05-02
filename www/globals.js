$(document).ready(function() { 

	logged_user = new User("samp","test");

	User.prototype.update = function() {
	 	$.post("http://wingmanapi.herokuapp.com/api/user/login",
	 	   {
	 	   		email: this.email,
	 	   		password: this.password
	 	   }
	 	).done(function(data) {
	 		console.log(data);
	 		$.extend(true,logged_user,data.user);
	 	});
	 	return this;
	}

	function User(email, password) {
		this.email = email;
		this.password = password;
		return this;
	}

	logged_user.update();

	window.setInterval(function() {
		logged_user.update();
	}, 3000);

	function Graph() {
		return this;
	}
	Graph.prototype.addNode = function() {
		return this;
	}

	$("[type=submit]").on("click", function(e) { e.preventDefault(); });
});