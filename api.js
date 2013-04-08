var express = require('express');

var app = express.createServer(express.logger());

app.get('/', function(request, response) {
	response.send('You\'re totally on a plane. It\'s in the sky. It\'s going fast.');
});

app.get('/secret', function(request, response) {
	response.send('This is a secret.');
});

var port = process.env.PORT || 5000;
app.listen(port, function() {
	console.log("Listening on " + port);
});