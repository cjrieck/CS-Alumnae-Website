$(function() {

	// async retrieval of LinkedIn API
	$.getScript('http://platform.linkedin.com/in.js?async=true', function()
	{
		IN.init({
			onLoad: onLinkedInLoad(),
			api_key: '77lw834nbnef0f',
			authorize: true
		});
	});

	function onLinkedInLoad() {
		IN.Event.on(IN, "auth", function() {onLinkedInLogin();}); // on authorization, perform onLinkedInLogin
	}

	function onLinkedInLogin() {

		if (IN.User.isAuthorized()) { // if user is authorized... 
			$('.login-button').hide(); // hide login button
			
			// get users profile and send result to postData()
			IN.API.Profile("me")
			.fields("id", "first-name", "last-name", "location", "positions", "picture-url", "picture-urls::(original)", "headline")
			.result( function(me) {
				console.log(me);
				postData(me["values"][0]); // will attempt to insert results into DB
			})
			.error(function(err) {
	    		alert(err);
		    });
		} else {
			$('.login-button').show(); // if not authorized, show login button
		}

	}

	// gets all user data in the form of rendered html
	function getAllUsers() {

		$.ajax({
			type: 'GET',
			url: '/all',
			success: function(data){

				$('.list').html(data); // clears and replaces html with the rendered html received
				
				getData();
				getUnregisteredUsers();
				
			},
			error: function(jqXHR, textStatus, errorThrown){
				console.log("bad: " + textStatus + ": " + errorThrown);
			}
		});

	}

	// will get all entries in the DB 'unregistered'
	// and put them onto the screen beneath the registered
	// users
	function getUnregisteredUsers() {
		
		$.ajax({
			type: 'GET',
			url: '/unregistered',
			success: function(data){

				$('.list').append(data); // append new html to previous html
				
			},
			error: function(jqXHR, textStatus, errorThrown){
				console.log("bad: " + textStatus + ": " + errorThrown);
			}
		});
	}

	// gets all user data in the form of JSON
	// and then use that to populate the map with
	// pins and individual tiles with info
	function getData() {
		$.ajax({
			type: 'GET',
			url: '/map-pins',
			success: function(data){
				if (data.length > 0){

					getLocations(data); // put map pins onto Google Map
					populateProfiles(data); // put picture and general info on persons card
				};
			},
			error: function(jqXHR, textStatus, errorThrown){
				console.log("bad: " + textStatus + ": " + errorThrown);
			}
		});
	}

	// gets user data based on a search criteria and sent back as
	// rendered html
	function searchRequest(searchCriteria) {

		$.ajax({
			type: 'GET',
			url: '/search/'+searchCriteria,
			success: function(data) {
				if (data.length > 0) {
					$('.results').html(data); // if returned something, fill html with results from search
				}
			},
			error: function(jqXHR, textStatus, errorThrown){
				console.log("bad: " + textStatus + ": " + errorThrown);
			}
		});
	}

	// takes in JSON data (LinkedIn results) and sends that to node server
	// to be inserted into DB
	function postData(data) {
		
		$.ajax({
			type: 'POST',
			url: '/request',
			data: JSON.stringify(data), // sends back JSON string
			contentType: "application/json; charset=utf-8",
			success: function(){
				
				getAllUsers(); // refresh page with new user

			},
			error: function(jqXHR, textStatus, errorThrown){
				console.log("bad: " + textStatus + ": " + errorThrown);
			}
		});
	};

	// will perform search in DB given the string in the input field
	function performSearch() {
		var searchCriteria = $('#searchBar').val(); // get value of search field

		if (searchCriteria.length > 0) {
			$('.item').animate({
				opacity: 0
			}, 1000);

			$('.list').empty();
			searchRequest(searchCriteria);
		}
	}

	// when the search button is clicked
	$('#submit').click(function(){
		performSearch();
	});

	// when enter is hit
	$('#searchBar').keypress(function(e){
		if (e.which === 13) {
			performSearch();
		}
	});

	// maps setup
    var geocoder, map,
    	mapOptions = {
		  center: new google.maps.LatLng(41.96727,-71.18495),
		  zoom: 3
		}

	// will pin pins onto the map based on user location given by the LinkedIn API
    function getLocations(userData) {
    	for (var i = 0; i < userData.length; i++) {
    		
    		var location;

    		// if no location data, break
			if (!userData[i].location) {
				break;
			}

			// checks to see if user is in Greater Boston Area
			// if they are then set the location to "Boston, MA"
			if (userData[i]["location"]["name"].indexOf("Boston") != -1) {
				location = "Boston, MA";
			} else {
				// otherwise, use the location data from LinkedIn
				location = userData[i]["location"]["name"];
			}

			// pins the locations onto the map (from Google documentation)
			geocoder.geocode( {"address": location}, function(results, status) {
			    if (status == google.maps.GeocoderStatus.OK) {
			      map.setCenter(results[0].geometry.location);
			      var marker = new google.maps.Marker({
			          map: map,
			          position: results[0].geometry.location
			      });
			    } else {
			      console.log('Geocode was not successful for the following reason: ' + status);
			    }
			});
		};
	};

	// populates individual cards
	function populateProfiles (userData){

		// checks if data passed in is a JSON object
		if ($.isPlainObject(userData)){

			// for each item, fill the picture src with value in JSON
			$.each(userData, function(item, value){
				var picture = value["pictureUrls"]["values"][0];

				$("#"+value.id).attr("src", picture);
			});
		}
	};

	// STRICTLY FOR TESTING
	function testData() {
		var data = [{
			id: 'adfasdfadf',
			firstName: 'Clayton',
			lastName: 'Rieck',
			pictureUrls: {
				values: ['http://momstown.ca/sites/national.momstown.espresso.furthermore.ca/files/thing1_thing2.jpg']
			}
		}];
		postData(data[0]);
	}

	function initialize() {
	  	geocoder = new google.maps.Geocoder();
	  	map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);

	  	console.log("INITIALIZE CODE:");
		
		getAllUsers();

		}

    google.maps.event.addDomListener(window, 'load', initialize);
});
