// may not need firebase
var express = require('express'),
 	logfmt = require('logfmt'),
	mongodb = require('mongodb'),
	Handlebars = require('handlebars'),
	exphbs = require('express3-handlebars'),
	_ = require('lodash'),
 	MongoClient = mongodb.MongoClient;

var app = express();

// define MONGO DB path
var MONGO_URL=process.env.MONGOHQ_URL || 'mongodb://localhost:27017/alumni';

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

			context = {people: items};

			console.log("INITIAL CONTEXT");
			console.log(items);

			res.render('home', context); // first page to load
		});

	});
});

// inserts new users into the database
app.post('/request', function(req, res){
	
	mongodb.Db.connect(MONGO_URL, function(err, db){
		var collection = db.collection('alumni');
		var exists = false;
		var that = this;

		// will try to query for a user with the same id as the one being passed in
		collection.find({id: req.body["id"]}).toArray(function(err, items) {

			console.log("FOUND: ");
			console.log(items);

			if (err) {
				db.close();
				return;
			}

			// if the returned items has something in it, then
			// that user already exists and we don't want to insert them again
			if (items.length > 0) {
				this.exists = true;
				res.send("Already exists");
			}

			else {

				// insert the entire object being passed in into the DB
				collection.insert([req.body], function(err, docs){

					if (err) {
						return console.error(err);
					}

					res.send('just inserted ' + docs.length + ' new documents!');

				});
			}
		});

	});
});

// STRICTLY FOR TESTING
// will clear alumni database
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
				if (err) {
					res.send(404);
					res.end();
				} else {
					console.log(items);
					res.json(items);
				}
			});

		});
});

// gets everything in the database, alumni
app.get('/map-pins', function(req, res){
	
	mongodb.Db.connect(MONGO_URL, function(err, db){
		var collection = db.collection('alumni');

		collection.find({}).toArray(function(err, items) {
			res.json(items);
		});

	});
});

// gets everthing in the database, alumni
app.get('/all', function(req, res){
	
	mongodb.Db.connect(MONGO_URL, function(err, db){
		var collection = db.collection('alumni');

		collection.find({}).toArray(function(err, items) {
			var context = {people: items};

			res.render('person', _.extend(context, {layout: false}));
		});
	});
});

// clean up results
app.get('/unregistered', function(req, res){

	// localhost usage only
	if (MONGO_URL === 'mongodb://localhost:27017/alumni') {
		MONGO_URL = 'mongodb://localhost:27017/unregistered'
	};

	mongodb.Db.connect(MONGO_URL, function(err, db){
		var collection = db.collection('unregistered');

		collection.find({}).toArray(function(err, unregistered_items){
			var that = this;
			
			// for localhost
			if (MONGO_URL === 'mongodb://localhost:27017/unregistered') {
				MONGO_URL = 'mongodb://localhost:27017/alumni';
			};

			mongodb.Db.connect(MONGO_URL, function(err, db){

				var registered_alumni = db.collection('alumni');

				registered_alumni.find({}).toArray(function(err, registered_items){

					if (err) {
						res.send(err);

					} else {

						// cleaning up entries with no email addresses
						for (var i = 0; i < unregistered_items.length; i++) {
							if (unregistered_items[i]["email_addr"] === "None"){
								delete unregistered_items[i]["email_addr"];
							};
						};

						// iterate through array of users signed in through LinkedIn
						for (var i = 0; i < registered_items.length; i++) {

							// iterate through array of users not signed in
							for (var a = 0; a < unregistered_items.length; a++){

								// if the first and last name of an entry in the registered array
								// and unregistered array match then they are registered and we want to
								// remove them from the unregistered array before we send the response back
								if (registered_items[i]["firstName"] === unregistered_items[a]["name_first"] && 
									registered_items[i]["lastName"] === unregistered_items[a]["name_last"]) {

									console.log("REMOVED USER");
									console.log(unregistered_items.splice(a, 1));

									// deletes an item in the array in place and returns new array
									unregistered_items = unregistered_items.splice(a, 1);
								};

							};
						};		
					} // end else

				});
			});
			
			var context = {u_people: unregistered_items};

			res.render('person', _.extend(context, {layout: false}));
		});
	});
});

// search bar request
app.get('/search/:name', function(req, res){
	console.log(req.params.name + ": " + req.params.name.length);

	mongodb.Db.connect(MONGO_URL, function(err, db){
		var collection = db.collection('alumni');

		// trying to make smart search.
		// should be able to search by first or last name,
		// position, or current location
		collection.find({
				$or: [
					{"firstName": {$regex: req.params.name, $options: 'i'}},
					{"lastName":  {$regex: req.params.name, $options: 'i'}},
					{"positions": {$elemMatch: {"values": 
								  {$elemMatch: {"company": 
								  {$elemMatch: {"name": {$regex: req.params.name, $options: 'i'}}}}}}}},
					{"location": {$elemMatch:  {"name": {$regex: req.params.name, $options: 'i'}}}}
				]}).toArray(function(err,items) {

					var unregistered_collection = db.collection('unregistered');

					// we also need to search the unregistered users and find those that also match
					// the inputted value
					// here, we just look by first or last name because there is little information
					// in the DB on them
					unregistered_collection.find({
						$or: [
							{"name_first": {$regex: req.params.name, $options: 'i'}},
							{"name_last": {$regex: req.params.name, $options: 'i'}}
						]}).toArray(function(err, unregistered_items) {
							
							if (err) {
								console.log(err);
								res.send(err);
								res.end();
							}
							
							else {
								console.log(unregistered_items);
							
								if ((items && items.length > 0) || (unregistered_items && unregistered_items.length > 0)) {
									var context = {people: items, u_people: unregistered_items};
									res.render('person', _.extend(context, {layout: false}));
								}
							}; // end else

						db.close();

					}); // end second callback
			
				}); // end first callback
				
	}); // end connection
	
	
});

var port = Number(process.env.PORT || 5000);
app.listen(port, function() {
  console.log("Listening on " + port);
});
