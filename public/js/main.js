$(function() {

	$.getScript('http://platform.linkedin.com/in.js?async=true', function()
	{
		IN.init({
			onLoad: onLinkedInLoad(),
			api_key: '77lw834nbnef0f',
			authorize: true
		});
	});

	function onLinkedInLoad() {
		console.log("ON LOAD")
		IN.Event.on(IN, "auth", function() {onLinkedInLogin();});
	}

	function onLinkedInLogin() {
		console.log("ON LOGIN");

		if (IN.User.isAuthorized()) {
			IN.API.Profile("me")
			.fields("id", "first-name", "last-name", "location", "positions", "picture-url", "picture-urls::(original)", "headline")
			.result( function(me) {
				// callback(me.values[0]);
				console.log(me);
				postData(me);
			})
			.error(function(err) {
	    		alert(err);
		    });
		};

	}

	function removeAllUsers() {
		$.ajax({
			type: 'POST',
			url: '/remove',
			success: function(data){
				console.log('removed all data');
			},
			error: function(jqXHR, textStatus, errorThrown) {
				console.log(textStatus +': '+errorThrown);
			}
		});
	}

	// STRICTLY FOR TESTING
  	// --------------------
  	// removeAllUsers();
  	// --------------------

	// gets all user data in the form of rendered html
	function getAllUsers() {
		$.ajax({
			type: 'GET',
			url: '/all',
			success: function(data){
				console.log("GET ALL USER DATA");
				console.log(data);

				$('.result').html(data);

				getLocations(data);
				populateProfiles(data);
			},
			error: function(jqXHR, textStatus, errorThrown){
				console.log("bad: " + textStatus + ": " + errorThrown);
			}
		});
	}

	// gets all user data in the form of JSON
	function getData() {
		$.ajax({
			type: 'GET',
			url: '/map-pins',
			success: function(data){
				console.log(data);

				getLocations(data);
				populateProfiles(data);
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
				console.log("SEARCH SUCCESS");
				console.log(data)
				if (data.length > 0) {
					$('.results').html(data);
				}
			},
			error: function(jqXHR, textStatus, errorThrown){
				console.log("bad: " + textStatus + ": " + errorThrown);
			}
			// error: function() {
			// 	alert("No users of that criteria");
			// }

		});
	}

	function postData(data) {
		console.log("in POST DATA");
		$.ajax({
			type: 'POST',
			url: '/request',
			data: JSON.stringify(data),
			contentType: "application/json; charset=utf-8",
			success: function(){
				console.log("success IN POST DATA");

				getData();
			},
			error: function(jqXHR, textStatus, errorThrown){
				console.log("bad: " + textStatus + ": " + errorThrown);
			}
		});
	};

	// when the search button is clicked
	$('#submit').click(function(){
		
		var searchCriteria = $('#searchBar').val();
		// console.log("CRITERIA: "+searchCriteria.length);

		if (searchCriteria.length > 0) {
			$('.item').animate({
				opacity: 0
			}, 1000);

			$('.list').empty();
			searchRequest(searchCriteria);
		}
		else {
			console.log("don't search");
		}

	});


    var geocoder, map,
    	mapOptions = {
		  center: new google.maps.LatLng(41.96727,-71.18495),
		  zoom: 3
		}

    function getLocations(userData) {
    	for (var i = 0; i < userData.length; i++) {
    		
    		var location;

			if (!userData[i].location) {
				break;
			}

			// checks to see if user is in Greater Boston Area
			if (userData[i]["location"]["name"].indexOf("Boston") != -1) {
				location = "Boston, MA";
			} else {
				location = userData[i]["location"]["name"];
			}

			geocoder.geocode( {"address": location}, function(results, status) {
				// console.log(results);
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

	function populateProfiles (userData){

		if ($.isPlainObject(userData)){
			$.each(userData, function(item, value){
				var picture = value["pictureUrls"]["values"][0];
				console.log(picture);

				$("#"+value.id).attr("src", picture);
			});
		}

	};

	// function getLinkedInData(callback) {
	// 	IN.API.Profile("me").fields("id", "first-name", "last-name", "location", "positions", "picture-url", "picture-urls::(original)", "headline").result( function(me) {
	// 		callback(me.values[0]);
	// 	});
	// }

	function onLinkedInAuth() {
		// console.log("before getLinkedInData");
		// getLinkedInData(function(data) {
		// 	console.log("in onLinkedInAuth");
		// 	postData(data);
		// });
		console.log("onLinkedInAuth");

		// if (!IN.User.isAuthorized()) {
			IN.API.Profile("me")
				.fields("id", "first-name", "last-name", "location", "positions", "picture-url", "picture-urls::(original)", "headline")
				.result( function(me) {
				// callback(me.values[0]);
				console.log(me);
				postData(me);
			})
				.error(function(err) {
		    		alert(err);
		    });
		// };
	
	};

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
		getData();

	  	// getAllUsers();

		// if (IN.User.isAuthorized()) {
			// getLinkedInData(function(userData) {
				
				// console.log("INITIALIZE CODE:");
				// console.log(userData);

				// postData(userData);

				// getAllUsers();
				// getData();

				// ajax call should be a POST
				// $.ajax({
				// 	type: 'GET',
				// 	url: '/users/' + userData.id,
				// 	success: function(data) {
				// 		console.log(data);

				// 		getAllUsers();
				// 		getData();
				// 	},
				// 	error: function(jqXHR, status) {
				// 		console.log(jqXHR);
				// 		console.log(status);
				// 	}
				// });
			// });
		}
		// testData();
	// };

    google.maps.event.addDomListener(window, 'load', initialize);
});
