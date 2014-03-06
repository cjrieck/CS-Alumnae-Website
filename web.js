// may not need firebase
var express = require('express');
	firebase = require('firebase');
 	logfmt = require('logfmt');
	mongodb = require('mongodb');
 	MongoClient = mongodb.MongoClient;


var app = express();
var MONGO_URL=process.env.MONGOHQ_URL;


//app.use(express.static(path.join(__dirname, 'public')));

app.configure(function(){
	app.use(logfmt.requestLogger());
	app.use(express.json());
	app.use("/", express.static(__dirname+"/"));
	// add other things to serve here
});

app.get('/', function(req, res){
	res.render('index.html'); // first page to load
});

app.post('/request', function(req, res){
	console.log(req.body);
	res.header("Access-Control-Allow-Origin", "*");
	res.send("OK");
	mongodb.Db.connect(MONGO_URL, function(err, db){
		var collection = db.collection('alumni');
		var exists = false;

		console.log('Inserting new documents');

		collection.find({id: req.body["id"]}).toArray(function(err, items) {
			if (err) {
				db.close();
				return;
			} 
			if (items.length > 0) {
				console.log(items);
				exists = true;
			}
			// db.close();
		});

		if (!exists) {
			collection.insert([req.body], function(err, docs){

				if (err) {
					return console.error(err);
				}

				console.log('just inserted ' + docs.length + ' new documents!');
				
				db.close();
			});

		} else {
			// if already exist, upsert()

			db.close();
		}
	});
});

app.get('/map-pins', function(req, res){
	var entry = req.body;
	mongodb.Db.connect(MONGO_URL, function(err, db){
		var collection = db.collection('alumni');

		collection.find({type: "location"}).toArray(function(err, items) {
			res.send(items);
		});

});


var port = Number(process.env.PORT || 5000);
app.listen(port, function() {
  console.log("Listening on " + port);
});
