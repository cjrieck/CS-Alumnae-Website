// may not need firebase
var express = require('express');
	firebase = require('firebase');
var logfmt = require('logfmt');

var app = express();

//app.use(express.static(path.join(__dirname, 'public')));

app.configure(function(){
	app.use(logfmt.requestLogger());
	app.use("/", express.static(__dirname+"/"));
	// add other things to serve here
});

app.get('/', function(req, res){
	res.render('index.html'); // first page to load
});

var port = 7500;

// defaults to port 7500 unless different port number passed in
if (process.argv[2] != 'undefined') port = process.argv[2];

app.listen(port, function(){
	console.log("Listening on port " + port);
});
