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
		collection.insert([{name:'tester1'}, {name:'coder'}, {name: 'TOM', title:'Prof Sir'}], function(err, docs){
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

app.post('/request', function(req, res){
	console.log(req.body);
	res.header("Access-Control-Allow-Origin", "*");
	res.send("OK");
});

var port = Number(process.env.PORT || 5000);
app.listen(port, function() {
  console.log("Listening on " + port);
});
