var express = require('express');
var mongo = require('mongodb');

var mongoUri = process.env.MONGOHQ_URL || 
  'mongodb://heroku:84c7ca002fa6079a82bad84714a0beb7@linus.mongohq.com:10093/app14677217'; 

var app = express.createServer();
app.use(express.logger('dev'));

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


