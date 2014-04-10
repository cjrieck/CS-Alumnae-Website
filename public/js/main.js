$(function() {

	// gets all user data in the form of rendered html
	function getAllUsers() {
		$.ajax({
			type: 'GET',
			url: '/all',
			success: function(data){
				console.log(data);

				$('.result').html(data);

				// getLocations(data);
				// populateProfiles(data);
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
				if (data.length > 0) {
					$('.results').html(data);
				}
			},
			error: function() {

			}

		});
	}

	function postData(data) {
		$.ajax({
			type: 'POST',
			url: '/request',
			data: JSON.stringify(data),
			contentType: "application/json; charset=utf-8",
			success: function(){
				console.log("success");
				getData();
			},
			error: function(jqXHR, textStatus, errorThrown){
				console.log("bad: " + textStatus + ": " + errorThrown);
			}
		});
	};

	$('#submit').click(function(){
		$('.list').empty();
		var searchCriteria = $('#searchBar').val();

		searchRequest(searchCriteria);

	});


    var geocoder, map,
    	mapOptions = {
		  center: new google.maps.LatLng(41.96727,-71.18495),
		  zoom: 3
		}

    function getLocations(userData) {
    	for (var i = 0; i < userData.length; i++) {
				if (!userData[i].location) {
					break;
				}
				geocoder.geocode( {"address": userData[i]["location"]["name"]}, function(results, status) {
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

		$.each(userData, function(item, value){
			var picture = value["pictureUrls"]["values"][0];
			console.log(picture);

			$("#"+value["id"]).attr("src", picture);
		});

	};

	function onLinkedInAuth() {
		getLinkedInData(function(data) {
			postData(data);
		});
	};

	function getLinkedInData(callback) {
		IN.API.Profile("me").fields("id", "first-name", "last-name", "location", "positions", "picture-url", "picture-urls::(original)", "headline").result( function(me) {
			callback(me.values[0]);
		});
	}

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
		// if (IN.User.isAuthorized()) {
			getLinkedInData(function(userData) {
				console.log(userData);

				$.ajax({
					type: 'GET',
					url: '/users/' + userData.id,
					success: function(data) {
						console.log(data);

						if (data.length === 0) {
							
							postData(userData);
						
						} else {
							getAllUsers(); // get all user data 
							getData();
						}
					},
					error: function(jqXHR, status) {
						console.log(jqXHR);
						console.log(status);
					}
				});
			});
		// }
		// testData();
	};

    google.maps.event.addDomListener(window, 'load', initialize);
});
