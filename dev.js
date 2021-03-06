// may not need firebase
var express = require('express');
	firebase = require('firebase');
 	logfmt = require('logfmt');
 	mongodb = require('mongodb');
 	MongoClient = mongodb.MongoClient;


var app = express();
var MONGO_URL=process.env.MONGOHQ_URL;

mongodb.Db.connect(MONGO_URL, function(err, db){
	var collection = db.collection('alumni');

	console.log('removing files');
	collection.remove(function(err, result){
		if(err) {
			return console.error(err);
		}
		console.log('Removed files!!');

		console.log('Inserting new documents');
		collection.insert([{name:'tester1'}, {name:'coder'}], function(err, docs){
			if (err) {
				return console.error(err);
			}

			console.log('just inserted ' + docs.length + ' new documents!');
			collection.find({}).toArray(function(err, docs){
				if (err){
					return console.error(err);
				}

				docs.forEach(function(doc){
					console.log('found document: ' + doc);
				});
			});
		});
	});
});

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
