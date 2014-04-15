// may not need firebase
var express = require('express'),
	firebase = require('firebase'),
 	logfmt = require('logfmt'),
	mongodb = require('mongodb'),
	Handlebars = require('handlebars'),
	exphbs = require('express3-handlebars'),
	_ = require('lodash'),
 	MongoClient = mongodb.MongoClient;

// var template = '<div class="list">{{#each items}}<div class"item">{{log this}}{{name}} {{class}}</div>{{/each}}</div>';
// var t = Handlebars.compile(template);

// Handlebars.registerHelper('log', function(something) {
// 	console.log(something);
// });

// var html = t(
// );

// console.log(html);

var app = express();
var MONGO_URL=process.env.MONGOHQ_URL || 'mongodb://localhost:27017/alumni';


//app.use(express.static(path.join(__dirname, 'public')));

app.configure(function(){
	app.use(logfmt.requestLogger());
	app.use(express.json());

	app.engine('.hbs', exphbs({defaultLayout: 'main', extname: '.hbs'}));
	app.set('view engine', '.hbs');

	app.use("/", express.static(__dirname+"/public"));
	// add other things to serve here
});

app.get('/', function(req, res){
	var context;

	mongodb.Db.connect(MONGO_URL, function(err, db){
		var collection = db.collection('alumni');

		collection.find({}).toArray(function(err, items) {

			context = {people: items[0]["values"]};

			console.log("INITIAL CONTEXT");
			console.log(items[0]["values"]);


			// res.render('person', _.extend(context, {layout: false}));
			res.render('home', context); // first page to load
		});

	});
});

app.post('/request', function(req, res){
	// console.log(req.body);
	res.header("Access-Control-Allow-Origin", "*");
	res.send("OK");
	mongodb.Db.connect(MONGO_URL, function(err, db){
		var collection = db.collection('alumni');
		var exists = false;
		var that = this;

		// console.log("REQUEST BODY ID: "+req.body["id"]);

		collection.find({id: req.body["id"]}).toArray(function(err, items) {
			if (err) {
				db.close();
				return;
			}
			if (items.length > 0) {
				// console.log("RESPONSE ITEMS: "+items);
				this.exists = true;
				res.send("Already exists");
			}

			else {
				// console.log('Inserting new documents');

				collection.insert([req.body], function(err, docs){

					if (err) {
						return console.error(err);
					}

					// console.log('just inserted ' + docs.length + ' new documents!');

					// db.close();
				});
			}
			// db.close();
		});

	});
});

app.post('/remove', function(req, res){
	mongodb.Db.connect(MONGO_URL, function(err, db){
		if (err) {
			console.log(err);
		}
		else{
			var collection = db.collection('alumni');
			collection.remove({});
			res.send("REMOVED");
		}
	});
});

app.get('/users/:id', function(req, res) {
		mongodb.Db.connect(MONGO_URL, function(err, db){
			var collection = db.collection('alumni');


			collection.find({}).toArray(function(err, items) {
			// collection.find({id: req.params.id}).toArray(function(err, items) {
				if (err) {
					res.send(404);
					res.end();
				} else {

					// var context = {people: items};
					// console.log("CONTEXT: "+items);
					
					// res.render('person', _.extend(context, {layout: false}));
					console.log(items);
					res.json(items);
				}
			});

		});
});

app.get('/map-pins', function(req, res){
	
	mongodb.Db.connect(MONGO_URL, function(err, db){
		var collection = db.collection('alumni');

		collection.find({}).toArray(function(err, items) {
			// console.log(items);
			res.json(items[0]["values"]);

			// var context = {people: items};
			// console.log("CONTEXT: "+items);

			// res.render('person', _.extend(context, {layout: false}));


			// res.render('home', context ); // first page to load
		});

	});
});

app.get('/all', function(req, res){
	
	mongodb.Db.connect(MONGO_URL, function(err, db){
		var collection = db.collection('alumni');

		collection.find({}).toArray(function(err, items) {
			// console.log(items);
			// res.json(items);

			var context = {people: items[0]["values"]};
			console.log('ALL CONTEXT: ');
			console.log(items);

			res.render('person', _.extend(context, {layout: false}));

			// res.render('home', context ); // first page to load
		});
		// db.close();	
	});
});

app.get('/search/:name', function(req, res){
	console.log(req.params.name + ": " + req.params.name.length);

	// if nothing passed in then return all of the values
	// if (req.params.name.length === 0) {
	// 	mongodb.Db.connect(MONGO_URL, function(err, db){
	// 		var collection = db.collection('alumni');

	// 		// only search for first name as of now
	// 		collection.find({}).toArray(function(err, items) {
	// 			if (err) {
	// 				console.log(err);
	// 				res.send(404);
	// 				res.end();
	// 			} else {
	// 				var context = {people: items};
	// 				console.log(items);
	// 				// res.json(context);
	// 				res.render('person', _.extend(context, {layout: false}));
	// 			};
	// 		});
	// 		db.close();
	// 	});
	// } else { 
	mongodb.Db.connect(MONGO_URL, function(err, db){
		var collection = db.collection('alumni');

		// only search for first name as of now
		// collection.find({firstName: req.params.name, 
		// 				lastName: req.params.name
		// 				 }).toArray(function(err, items) {
		// collection.find({"values": {$elemMatch: {
		// 		"firstName": req.params.name,
		// 		"lastName": req.params.name
		// 		//"position": {$elemMatch {"company": req.params.name}},
		// 		//"location": {$elemMatch {"name" req.params.name}}
		// 		}}}).toArray(function(err, items) {
		collection.find({"values": {$elemMatch: {
				$or: [
				{"firstName": {$regex: req.params.name, $options: 'i'}},
				{"lastName": {$regex: req.params.name, $options: 'i'}},
				{"positions": {$elemMatch: {"values": 
							{$elemMatch: {"company": 
							{$elemMatch: {"name": {$regex: req.params.name, $options: 'i'}}}}}}}}
				]
				}}}).toArray(function(err,items) {
			if (err) {
				console.log(err);
				res.send(err);
				res.end();
			} else {	
				if (items.length > 0) {
					var context = {people: items[0]["values"]};
					res.render('person', _.extend(context, {layout: false}));
				}
			};
			db.close();
		});
		//db.close();
	});
	// }
	
});

var port = Number(process.env.PORT || 5000);
app.listen(port, function() {
  console.log("Listening on " + port);
});
