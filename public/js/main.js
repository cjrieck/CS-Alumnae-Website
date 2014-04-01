
$(function() {
	// initialize();


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

	function onLinkedInAuth() {
		getLinkedInData(function(data) {
			postData(data);
		});
	};

	function getLinkedInData(callback) {
		IN.API.Profile("me").fields("id", "first-name", "last-name", "location", "positions", "picture-url", "picture-urls::(original)").result( function(me) {
			callback(me.values[0]);
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
				getPins();
			},
			error: function(jqXHR, textStatus, errorThrown){
				console.log("bad: " + textStatus + ": " + errorThrown);
			}
		});
	};
	function populateProfiles (userData){

		$.each(userData, function(item, value){
			var picture = value["pictureUrls"]["values"][0];
			console.log(picture);

			$("#"+value["id"]).attr("src", picture);
		});

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

	function getPins() {
		$.ajax({
			type: 'GET',
				url: '/map-pins',
				success: function(data){
				getLocations(data);
				populateProfiles(data);
			},
			error: function(jqXHR, textStatus, errorThrown){
				console.log("bad: " + textStatus + ": " + errorThrown);
			}
		});
	}

	function initialize() {
  	geocoder = new google.maps.Geocoder();
  	map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);
		if (IN.User.isAuthorized()) {
			getLinkedInData(function(userData) {
				console.log(userData);
				$.ajax({
					type: 'GET',
					url: '/users/' + userData.id,
					success: function(data) {
						if (data.length === 0) {
							postData(userData);
						} else {
							getPins();
						}
					},
					error: function(jqXHR, status) {
						console.log(jqXHR);
						console.log(status);
					}
				});
			});
		}
		// testData();
	};

    google.maps.event.addDomListener(window, 'load', initialize);
});
